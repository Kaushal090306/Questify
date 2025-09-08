from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import Quiz, Question, QuizAttempt
from .utils import parse_document, generate_quiz_with_gemini
from .models import UserQuizAnalytics
from django.db import models
from django.conf import settings
import os

class QuizGenerateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            print(f"DEBUG: Starting quiz generation")
            print(f"DEBUG: Request data: {request.data}")
            print(f"DEBUG: Request files: {request.FILES}")
            # Support multiple files via 'files' as well as single 'file'
            files = request.FILES.getlist('files')
            single_file = request.FILES.get('file')
            if not files and single_file:
                files = [single_file]
            
            if not files:
                return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate files (size limit 10MB each)
            for f in files:
                if f.size > 10 * 1024 * 1024:
                    return Response({'error': f'File {f.name} size too large. Max 10MB each'}, status=status.HTTP_400_BAD_REQUEST)

            # Title handling
            title = request.data.get('title')
            if not title:
                title = files[0].name if len(files) == 1 else 'Combined Quiz from Multiple Documents'
            num_questions = int(request.data.get('num_questions', 5))
            difficulty = request.data.get('difficulty', 'medium')
            quiz_type = request.data.get('quiz_type', 'multiple_choice')
            time_limit = request.data.get('time_limit')
            if time_limit:
                time_limit = int(time_limit)
            
            print(f"DEBUG: Quiz parameters - title: {title}, num_questions: {num_questions}, difficulty: {difficulty}, quiz_type: {quiz_type}, time_limit: {time_limit}")

            # Save files to media for later download/reference and parse
            combined_text_parts = []
            saved_file_urls = []
            for f in files:
                # Save to media/quiz_uploads/<quiz_id>/incoming
                upload_dir = os.path.join(settings.MEDIA_ROOT, 'quiz_uploads', 'incoming')
                os.makedirs(upload_dir, exist_ok=True)
                save_path = os.path.join(upload_dir, f.name)
                # Read bytes once
                file_bytes = f.read()
                with open(save_path, 'wb+') as destination:
                    destination.write(file_bytes)
                saved_file_urls.append(os.path.join(settings.MEDIA_URL, 'quiz_uploads', 'incoming', f.name))

                # Reset pointer for parsing
                try:
                    f.seek(0)
                except Exception:
                    pass
                parsed = parse_document(f)
                print(f"DEBUG: Parsed text length for {f.name}: {len(parsed)}")
                if parsed:
                    combined_text_parts.append(parsed)
            text = "\n\n".join(combined_text_parts)
            print(f"DEBUG: Combined parsed text length: {len(text)} from {len(files)} file(s)")
            if len(text.strip()) < 100:
                return Response({'error': 'Document content too short'}, status=status.HTTP_400_BAD_REQUEST)

            quiz_data = generate_quiz_with_gemini(text, num_questions, difficulty, quiz_type)
            if not quiz_data or not isinstance(quiz_data, dict) or 'quiz' not in quiz_data:
                print(f"DEBUG: Invalid quiz_data returned: {quiz_data}")
                return Response({'error': 'AI service returned no usable content. Please try again later.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            print(f"DEBUG: Quiz data generated successfully: {len(quiz_data.get('quiz', []))} questions")

            quiz = Quiz.objects.create(
                user=request.user,
                title=title,
                difficulty=difficulty,
                quiz_type=quiz_type,
                time_limit=time_limit,
                total_questions=len(quiz_data['quiz']),
                source_document=files[0].name if len(files) == 1 else ', '.join([f.name for f in files[:3]]) + ("..." if len(files) > 3 else "")
            )
            print(f"DEBUG: Quiz created with ID: {quiz.id}")

            created_questions = []
            for i, q in enumerate(quiz_data['quiz']):
                question = Question.objects.create(
                    quiz=quiz,
                    question_text=q['question_text'],
                    question_type=q['question_type'],
                    options=q['options'],
                    correct_answer=q['correct_answer'],
                    explanation=q.get('explanation', ''),
                    topic=q.get('topic', 'General'),
                    difficulty=q.get('difficulty', difficulty),
                    order=i
                )
                created_questions.append(question)
            print(f"DEBUG: Created {len(created_questions)} questions")

            output_questions = [
                {
                    "question_id": str(q.id),
                    "question_text": q.question_text,
                    "question_type": q.question_type,
                    "options": q.options,
                    "topic": q.topic,
                    "difficulty": q.difficulty
                }
                for q in created_questions
            ]

            response_data = {
                "quiz_id": str(quiz.id),
                "title": quiz.title,
                "questions": output_questions,
                "documents": saved_file_urls
            }
            print(f"DEBUG: Returning response: {response_data}")
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            traceback.print_exc()
            error_message = 'Failed to generate quiz. '
            if 'Content blocked' in str(e):
                error_message += 'The content was flagged by safety filters.'
            elif 'SERVICE_UNAVAILABLE' in str(e) or 'No content in Gemini response' in str(e):
                error_message += 'AI service temporarily unavailable.'
                return Response({'error': error_message}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            elif 'No text content' in str(e):
                error_message += 'AI service returned empty response.'
            else:
                error_message += 'Please try again later.'
            return Response({'error': error_message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QuizTakeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, quiz_id):
        quiz = get_object_or_404(Quiz, id=quiz_id)
        questions = Question.objects.filter(quiz=quiz).order_by('order')
        quiz_data = {
            'quiz_id': str(quiz.id),
            'title': quiz.title,
            'difficulty': quiz.difficulty,
            'quiz_type': quiz.quiz_type,
            'total_questions': quiz.total_questions,
            'time_limit': quiz.time_limit,
            'questions': [
                {
                    'question_id': str(q.id),
                    'question_text': q.question_text,
                    'question_type': q.question_type,
                    'options': q.options,
                    'topic': q.topic,
                    'difficulty': q.difficulty,
                    'order': q.order,
                    'explanation': q.explanation,
                }
                for q in questions
            ],
        }
        return Response(quiz_data, status=status.HTTP_200_OK)

    def post(self, request, quiz_id):
        try:
            print(f"DEBUG: Starting quiz submission for quiz_id: {quiz_id}")
            quiz = get_object_or_404(Quiz, id=quiz_id)
            questions = Question.objects.filter(quiz=quiz).order_by('order')

            user_answers = request.data.get("answers", {})
            if not user_answers or not isinstance(user_answers, dict):
                return Response({"error": "Answers must be provided as a dictionary."}, status=status.HTTP_400_BAD_REQUEST)

            answered_questions = [qid for qid, answer in user_answers.items() if answer and str(answer).strip()]
            if not answered_questions:
                return Response({"error": "Please answer at least one question before submitting."}, status=status.HTTP_400_BAD_REQUEST)

            correct_count = 0
            question_results = []
            total_questions = questions.count()

            # Process each question and create detailed results
            for question in questions:
                qid_str = str(question.id)
                user_answer = user_answers.get(qid_str, None)
                is_correct = False
                
                if user_answer is not None:
                    if question.question_type in ['fill_in_blank', 'true_false']:
                        is_correct = user_answer.strip().lower() == question.correct_answer.strip().lower()
                    else:
                        is_correct = user_answer == question.correct_answer
                
                if is_correct:
                    correct_count += 1

                # Create detailed question result
                question_result = {
                    "question_id": qid_str,
                    "is_correct": is_correct,
                    "points_earned": 1 if is_correct else 0,
                    "max_points": 1
                }
                question_results.append(question_result)

            percentage = (correct_count / total_questions) * 100 if total_questions else 0.0
            passed = percentage >= 70  # Using 70% as pass threshold

            # Create the quiz attempt with enhanced data
            attempt = QuizAttempt.objects.create(
                user=request.user,
                quiz=quiz,
                score=correct_count,
                total_questions=total_questions,
                percentage=percentage,
                passed=passed,
                pass_threshold=70.0,
                is_completed=True,
                completed_at=timezone.now(),
                user_answers=user_answers,
                question_results=question_results
            )

            # Generate detailed results for question-by-question review
            detailed_results = attempt.generate_detailed_results()

            # Update quiz statistics
            quiz.total_attempts += 1
            quiz.average_score = ((quiz.average_score * (quiz.total_attempts - 1)) + percentage) / quiz.total_attempts
            quiz.save(update_fields=['total_attempts', 'average_score'])

            # Update user analytics
            self._update_user_analytics(request.user)

            response_data = {
                "attempt_id": str(attempt.id),
                "score": percentage,
                "passed": passed,
                "total_questions": total_questions,
                "correct_answers": correct_count,
                "incorrect_answers": total_questions - correct_count,
                "pass_threshold": 70.0,
                "detailed_results": detailed_results,
                "summary": {
                    "accuracy": f"{percentage:.1f}%",
                    "performance": self._get_performance_level(percentage),
                    "time_taken": None,  # Will be added when timing is implemented
                    "strength_areas": self._get_strength_areas(detailed_results),
                    "improvement_areas": self._get_improvement_areas(detailed_results)
                }
            }
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Internal server error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _update_user_analytics(self, user):
        """Update user quiz analytics"""
        try:
            analytics, created = UserQuizAnalytics.objects.get_or_create(user=user)
            analytics.update_analytics()
        except Exception as e:
            print(f"Error updating user analytics: {e}")

    def _get_performance_level(self, percentage):
        """Get performance level based on percentage"""
        if percentage >= 90:
            return "Excellent"
        elif percentage >= 80:
            return "Very Good"
        elif percentage >= 70:
            return "Good"
        elif percentage >= 60:
            return "Satisfactory"
        else:
            return "Needs Improvement"

    def _get_strength_areas(self, detailed_results):
        """Identify areas where user performed well"""
        strength_areas = {}
        for result in detailed_results:
            if result.get('is_correct', False):
                topic = result.get('topic', 'General')
                if topic not in strength_areas:
                    strength_areas[topic] = 0
                strength_areas[topic] += 1
        
        # Return top 3 strength areas
        sorted_strengths = sorted(strength_areas.items(), key=lambda x: x[1], reverse=True)
        return [{"topic": topic, "correct_answers": count} for topic, count in sorted_strengths[:3]]

    def _get_improvement_areas(self, detailed_results):
        """Identify areas where user needs improvement"""
        improvement_areas = {}
        for result in detailed_results:
            if not result.get('is_correct', False):
                topic = result.get('topic', 'General')
                if topic not in improvement_areas:
                    improvement_areas[topic] = 0
                improvement_areas[topic] += 1
        
        # Return top 3 improvement areas
        sorted_improvements = sorted(improvement_areas.items(), key=lambda x: x[1], reverse=True)
        return [{"topic": topic, "incorrect_answers": count} for topic, count in sorted_improvements[:3]]


class QuizAttemptsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        attempts = QuizAttempt.objects.filter(user=request.user).order_by('-created_at')[:50]
        data = []
        
        for attempt in attempts:
            data.append({
                "attempt_id": str(attempt.id),
                "quiz_id": str(attempt.quiz.id),
                "quiz_title": attempt.quiz.title,
                "quiz_difficulty": attempt.quiz.difficulty,
                "quiz_type": attempt.quiz.quiz_type,
                "score": attempt.percentage,
                "passed": attempt.passed,
                "total_questions": attempt.total_questions,
                "correct_answers": attempt.score,
                "incorrect_answers": attempt.total_questions - attempt.score,
                "time_taken": attempt.time_taken,
                "completed_at": attempt.completed_at,
                "quiz_created_at": attempt.quiz.created_at,  # Add quiz creation date
                "performance_level": self._get_performance_level(attempt.percentage)
            })
        
        # Get summary statistics
        total_attempts = QuizAttempt.objects.filter(user=request.user, is_completed=True).count()
        total_passed = QuizAttempt.objects.filter(user=request.user, is_completed=True, passed=True).count()
        average_score = QuizAttempt.objects.filter(user=request.user, is_completed=True).aggregate(
            avg_score=models.Avg('percentage')
        )['avg_score'] or 0
        
        response_data = {
            "attempts": data,
            "summary": {
                "total_attempts": total_attempts,
                "total_passed": total_passed,
                "total_failed": total_attempts - total_passed,
                "pass_rate": (total_passed / total_attempts * 100) if total_attempts > 0 else 0,
                "average_score": round(average_score, 1)
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)

    def _get_performance_level(self, percentage):
        """Get performance level based on percentage"""
        try:
            p = float(percentage or 0)
        except Exception:
            p = 0.0
        if p >= 90:
            return "Excellent"
        if p >= 80:
            return "Very Good"
        if p >= 70:
            return "Good"
        if p >= 60:
            return "Satisfactory"
        return "Needs Improvement"
class AttemptDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, attempt_id):
        attempt = get_object_or_404(QuizAttempt, id=attempt_id, user=request.user)
        quiz = attempt.quiz
        questions = Question.objects.filter(quiz=quiz).order_by('order')
        return Response({
            "attempt": {
                "attempt_id": str(attempt.id),
                "quiz_id": str(quiz.id),
                "quiz_title": quiz.title,
                "quiz_type": quiz.quiz_type,
                "difficulty": quiz.difficulty,
                "score": attempt.percentage,
                "passed": attempt.passed,
                "total_questions": attempt.total_questions,
                "time_taken": attempt.time_taken,
                "completed_at": attempt.completed_at,
            },
            "questions": [
                {
                    "question_id": str(q.id),
                    "question_text": q.question_text,
                    "question_type": q.question_type,
                    "options": q.options,
                    "correct_answer": q.correct_answer,
                    "explanation": q.explanation,
                    "user_answer": attempt.user_answers.get(str(q.id), ''),
                    "is_correct": next((r.get('is_correct') for r in attempt.question_results if r.get('question_id') == str(q.id)), False),
                }
                for q in questions
            ],
            "documents": ([
                os.path.join(settings.MEDIA_URL, 'quiz_uploads', 'incoming', quiz.source_document)
            ] if quiz.source_document else [])
        }, status=status.HTTP_200_OK)

    def _get_performance_level(self, percentage):
        """Get performance level based on percentage"""
        if percentage >= 90:
            return "Excellent"
        elif percentage >= 80:
            return "Very Good"
        elif percentage >= 70:
            return "Good"
        elif percentage >= 60:
            return "Satisfactory"
        else:
            return "Needs Improvement"


class DailyPracticeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"daily_practice": []}, status=status.HTTP_200_OK)


class QuizAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get comprehensive quiz analytics for the user"""
        try:
            # Get or create user analytics
            analytics, created = UserQuizAnalytics.objects.get_or_create(user=request.user)
            if not created:
                analytics.update_analytics()
            
            # Get recent quiz attempts for trend analysis
            recent_attempts = QuizAttempt.objects.filter(
                user=request.user, 
                is_completed=True
            ).order_by('-completed_at')[:10]
            
            # Calculate trend (improving, declining, or stable)
            trend = self._calculate_trend(recent_attempts)
            
            # Get topic performance breakdown
            topic_breakdown = self._get_topic_breakdown(request.user)
            
            # Get difficulty performance breakdown
            difficulty_breakdown = self._get_difficulty_breakdown(request.user)
            
            # Get quiz type performance breakdown
            quiz_type_breakdown = self._get_quiz_type_breakdown(request.user)
            
            response_data = {
                "overview": {
                    "total_quizzes_taken": analytics.total_quizzes_taken,
                    "total_questions_answered": analytics.total_questions_answered,
                    "total_correct_answers": analytics.total_correct_answers,
                    "overall_accuracy": round(analytics.overall_accuracy, 1),
                    "total_passed_quizzes": analytics.total_passed_quizzes,
                    "total_failed_quizzes": analytics.total_failed_quizzes,
                    "pass_rate": round((analytics.total_passed_quizzes / analytics.total_quizzes_taken * 100) if analytics.total_quizzes_taken > 0 else 0, 1)
                },
                "performance_by_difficulty": {
                    "easy": {
                        "quizzes_taken": analytics.easy_quizzes_taken,
                        "accuracy": round(analytics.easy_accuracy, 1)
                    },
                    "medium": {
                        "quizzes_taken": analytics.medium_quizzes_taken,
                        "accuracy": round(analytics.medium_accuracy, 1)
                    },
                    "hard": {
                        "quizzes_taken": analytics.hard_quizzes_taken,
                        "accuracy": round(analytics.hard_accuracy, 1)
                    }
                },
                "performance_by_type": {
                    "multiple_choice": round(analytics.multiple_choice_accuracy, 1),
                    "true_false": round(analytics.true_false_accuracy, 1),
                    "fill_in_blank": round(analytics.fill_in_blank_accuracy, 1),
                    "descriptive": round(analytics.descriptive_accuracy, 1)
                },
                "time_analytics": {
                    "average_time_per_question": round(analytics.average_time_per_question, 1),
                    "fastest_quiz_completion": analytics.fastest_quiz_completion,
                    "slowest_quiz_completion": analytics.slowest_quiz_completion
                },
                "recent_performance": {
                    "accuracy": round(analytics.recent_accuracy, 1),
                    "quizzes_count": analytics.recent_quizzes_count
                },
                "trend": trend,
                "topic_breakdown": topic_breakdown,
                "difficulty_breakdown": difficulty_breakdown,
                "quiz_type_breakdown": quiz_type_breakdown,
                "streaks": {
                    "current_streak": analytics.current_streak,
                    "longest_streak": analytics.longest_streak
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Error fetching analytics: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _calculate_trend(self, recent_attempts):
        """Calculate if performance is improving, declining, or stable"""
        if len(recent_attempts) < 2:
            return "insufficient_data"
        
        # Split into two halves and compare
        mid_point = len(recent_attempts) // 2
        recent_half = recent_attempts[:mid_point]
        older_half = recent_attempts[mid_point:]
        
        recent_avg = sum(a.percentage for a in recent_half) / len(recent_half)
        older_avg = sum(a.percentage for a in older_half) / len(older_half)
        
        difference = recent_avg - older_avg
        
        if difference > 5:
            return "improving"
        elif difference < -5:
            return "declining"
        else:
            return "stable"

    def _get_topic_breakdown(self, user):
        """Get performance breakdown by topic"""
        analytics = UserQuizAnalytics.objects.get(user=user)
        return analytics.topic_performance

    def _get_difficulty_breakdown(self, user):
        """Get performance breakdown by difficulty"""
        analytics = UserQuizAnalytics.objects.get(user=user)
        return {
            "easy": {
                "quizzes_taken": analytics.easy_quizzes_taken,
                "accuracy": round(analytics.easy_accuracy, 1)
            },
            "medium": {
                "quizzes_taken": analytics.medium_quizzes_taken,
                "accuracy": round(analytics.medium_accuracy, 1)
            },
            "hard": {
                "quizzes_taken": analytics.hard_quizzes_taken,
                "accuracy": round(analytics.hard_accuracy, 1)
            }
        }

    def _get_quiz_type_breakdown(self, user):
        """Get performance breakdown by quiz type"""
        analytics = UserQuizAnalytics.objects.get(user=user)
        return {
            "multiple_choice": round(analytics.multiple_choice_accuracy, 1),
            "true_false": round(analytics.true_false_accuracy, 1),
            "fill_in_blank": round(analytics.fill_in_blank_accuracy, 1),
            "descriptive": round(analytics.descriptive_accuracy, 1)
        }

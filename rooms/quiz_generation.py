from django.shortcuts import render
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from quizzes.utils import parse_document, generate_quiz_with_gemini

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_room_quiz(request):
    """Generate quiz questions for room creation without saving to database"""
    try:
        print("DEBUG: Starting room quiz generation")
        print(f"DEBUG: Request data: {request.data}")
        print(f"DEBUG: Request files: {request.FILES}")
        
        # Get uploaded file
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate file size (10MB limit)
        if file.size > 10 * 1024 * 1024:
            return Response({'error': 'File size too large. Max 10MB'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get parameters
        num_questions = int(request.data.get('num_questions', 5))
        difficulty = request.data.get('difficulty', 'medium')
        question_types = request.data.getlist('question_types') or ['multiple_choice']  # Get multiple types
        
        print(f"DEBUG: Parameters - num_questions: {num_questions}, difficulty: {difficulty}, question_types: {question_types}")
        
        # Parse document
        parsed_text = parse_document(file)
        print(f"DEBUG: Parsed text length: {len(parsed_text)} from {file.name}")
        
        if len(parsed_text.strip()) < 100:
            return Response({'error': 'Document content too short to generate meaningful questions'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate quiz using AI with multiple question types
        quiz_data = generate_quiz_with_gemini(parsed_text, num_questions, difficulty, question_types)
        
        if not quiz_data or not isinstance(quiz_data, dict) or 'quiz' not in quiz_data:
            print(f"DEBUG: Invalid quiz_data returned: {quiz_data}")
            return Response({'error': 'AI service returned no usable content. Please try again later.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        print(f"DEBUG: Quiz data generated successfully: {len(quiz_data.get('quiz', []))} questions")
        
        # Format questions for frontend editing
        formatted_questions = []
        for i, q in enumerate(quiz_data['quiz']):
            formatted_question = {
                'question_text': q.get('question_text', ''),
                'question_type': q.get('question_type', 'multiple_choice'),
                'options': q.get('options', []),
                'correct_answer': q.get('correct_answer', ''),
                'explanation': q.get('explanation', ''),
                'points': 1,  # Default points
                'time_limit': None,  # Will be set by room settings
                'order': i
            }
            
            # Ensure correct_answer is in the right format based on question type
            if formatted_question['question_type'] == 'multiple_choice':
                # Find the index of the correct answer
                correct_text = formatted_question['correct_answer']
                if correct_text in formatted_question['options']:
                    formatted_question['correct_answer'] = formatted_question['options'].index(correct_text)
                else:
                    formatted_question['correct_answer'] = 0  # Default to first option
            elif formatted_question['question_type'] == 'true_false':
                formatted_question['options'] = ['True', 'False']
                if str(formatted_question['correct_answer']).lower() in ['true', '1']:
                    formatted_question['correct_answer'] = 0
                else:
                    formatted_question['correct_answer'] = 1
            
            formatted_questions.append(formatted_question)
        
        return Response({
            'quiz': formatted_questions,
            'message': f'Successfully generated {len(formatted_questions)} questions from {file.name}'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"DEBUG: Error in room quiz generation: {str(e)}")
        return Response({
            'error': f'Failed to generate quiz: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

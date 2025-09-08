from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Profile
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_stats(request):
    """Get user statistics for dashboard"""
    user = request.user
    
    # Basic stats for now
    return Response({
        'total_quizzes': 0,
        'total_points': 0,
        'current_streak': 0,
        'best_streak': 0,
        'average_score': 0,
        'badges': [],
    })

class RegisterView(generics.CreateAPIView):
    """User registration view"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            data = request.data
            logger.info(f"Registration attempt for: {data.get('email', 'unknown')}")
            
            # Extract user data
            email = data.get('email', '').strip()
            password = data.get('password', '')
            first_name = data.get('first_name', '').strip()
            last_name = data.get('last_name', '').strip()
            
            # For backward compatibility, also check for username field
            if not email and data.get('username'):
                email = data.get('username', '').strip()
            
            # Validation
            if not email:
                return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            if not password:
                return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user already exists
            if User.objects.filter(email=email).exists():
                return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate password
            try:
                validate_password(password)
            except ValidationError as e:
                return Response({'error': e.messages}, status=status.HTTP_400_BAD_REQUEST)
            
            # Create user
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            # Create profile
            profile, created = Profile.objects.get_or_create(user=user)
            
            logger.info(f"User created successfully: {user.email} (ID: {user.id})")
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'User registered successfully',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            return Response({'error': 'Registration failed. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProfileView(generics.RetrieveUpdateAPIView):
    """User profile view"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        try:
            user = request.user
            logger.info(f"Profile request for user: {user.email} (ID: {user.id})")
            
            # Get or create profile
            profile, created = Profile.objects.get_or_create(user=user)
            
            return Response({
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'date_joined': user.date_joined,
                    'last_login': user.last_login,
                    'role': user.role,
                },
                'profile': {
                    'bio': profile.bio,
                    'total_points': profile.total_points,
                    'current_streak': profile.current_streak,
                    'best_streak': profile.best_streak,
                    'badges': profile.badges,
                    'daily_practice_enabled': profile.daily_practice_enabled,
                    'email_notifications': profile.email_notifications,
                }
            })
        except Exception as e:
            logger.error(f"Profile retrieval error: {str(e)}")
            return Response({'error': 'Failed to retrieve profile'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

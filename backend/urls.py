from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from .cors_test_views import cors_test_view, cors_preflight_view

def api_root(request):
    """API root endpoint"""
    return JsonResponse({
        'message': 'Welcome to Questify API',
        'version': '1.0',
        'endpoints': {
            'admin': '/admin/',
            'users': '/api/users/',
            'quiz': '/api/quiz/',
            'rooms': '/api/rooms/',
            'multiplayer': '/api/multiplayer/',
            'cors-test': '/api/cors-test/',
        }
    })

urlpatterns = [
    path('', api_root, name='api_root'),  # Add this line for root URL
    path('admin/', admin.site.urls),
    path('api/users/', include('accounts.urls')),
    path('api/quiz/', include('quizzes.urls')),
    path('api/rooms/', include('rooms.urls')),
    path('api/multiplayer/', include('multiplayer.urls')),
    path('api/cors-test/', cors_preflight_view, name='cors_test'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

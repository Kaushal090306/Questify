from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View

def cors_test_view(request):
    """Simple test view to check if manual CORS headers work"""
    response = JsonResponse({
        'message': 'CORS test successful',
        'method': request.method,
        'headers': dict(request.headers)
    })
    
    # Manually add CORS headers
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    response['Access-Control-Allow-Credentials'] = 'true'
    
    return response

@csrf_exempt
def cors_preflight_view(request):
    """Handle preflight OPTIONS requests"""
    if request.method == 'OPTIONS':
        response = JsonResponse({'message': 'Preflight OK'})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'
        return response
    else:
        return cors_test_view(request)

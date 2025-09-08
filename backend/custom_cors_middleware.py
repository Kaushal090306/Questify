"""
Custom CORS middleware as a fallback solution
"""
from django.http import JsonResponse

class CustomCorsMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Handle preflight OPTIONS requests BEFORE processing
        if request.method == 'OPTIONS':
            response = JsonResponse({'message': 'Preflight OK'})
            self.add_cors_headers(response)
            return response
        
        # Process the request normally
        response = self.get_response(request)
        
        # Add CORS headers to all responses
        self.add_cors_headers(response)
        
        return response
    
    def add_cors_headers(self, response):
        """Add CORS headers to response"""
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Access-Control-Max-Age'] = '86400'
        return response

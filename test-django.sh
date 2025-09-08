#!/bin/bash

# Test Django app configuration
echo "Testing Django configuration..."

# Check if Django can import
python -c "import django; print(f'Django version: {django.get_version()}')"

# Check if settings can be loaded
python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings'); import django; django.setup(); print('Django settings loaded successfully')"

# Test if we can run Django check
python manage.py check --deploy

echo "Django configuration test completed!"

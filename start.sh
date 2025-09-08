#!/bin/bash
# Start script for Django app on Render

echo "Starting Django application..."
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Files in current directory:"
ls -la

# Check if manage.py exists
if [ -f "manage.py" ]; then
    echo "manage.py found"
    echo "Django version: $(python -c 'import django; print(django.get_version())')"
else
    echo "manage.py not found!"
    exit 1
fi

# Start gunicorn
exec gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120

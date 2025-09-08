#!/bin/bash
set -e  # Exit on error

echo "Running pre-start setup..."

# Set Django settings
export DJANGO_SETTINGS_MODULE=backend.settings

# Wait for database to be available
echo "Waiting for database..."
python -c "
import time
import os
import sys

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from django.db import connection
from django.db.utils import OperationalError

max_retries = 30
retry_count = 0

while retry_count < max_retries:
    try:
        connection.ensure_connection()
        print('Database connection successful!')
        break
    except OperationalError as e:
        retry_count += 1
        print(f'Database not ready, retrying... ({retry_count}/{max_retries})')
        print(f'Error: {e}')
        time.sleep(2)
else:
    print('Could not connect to database after 30 retries')
    print('Check database configuration and try again')
    sys.exit(1)
"

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Create superuser if needed (optional)
echo "Checking for superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(is_superuser=True).exists():
    print('No superuser found - you can create one later via Django admin')
else:
    print('Superuser already exists')
" || echo "Could not check superuser status"

echo "Pre-start setup complete! Starting application..."

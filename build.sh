#!/bin/bash
set -o errexit  # Exit on error

echo "Starting build process..."

# Upgrade pip first
pip install --upgrade pip

# Install dependencies with fallback
if [ -f "requirements-deploy.txt" ]; then
    echo "Installing deployment requirements..."
    pip install -r requirements-deploy.txt
else
    echo "Installing regular requirements..."
    pip install -r requirements.txt
fi

echo "Collecting static files..."
# Collect static files
python manage.py collectstatic --noinput

echo "Running migrations..."
# Run migrations
python manage.py migrate --noinput

echo "Build completed successfully!"

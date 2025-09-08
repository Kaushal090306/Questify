#!/bin/bash
set -o errexit  # Exit on error

echo "Starting build process..."

# Upgrade pip and essential tools first
echo "Upgrading pip and core packages..."
pip install --upgrade pip setuptools wheel

# Install dependencies with fallback
if [ -f "requirements-stable.txt" ]; then
    echo "Installing stable requirements..."
    pip install -r requirements-stable.txt
elif [ -f "requirements-deploy.txt" ]; then
    echo "Installing deployment requirements..."
    pip install -r requirements-deploy.txt
else
    echo "Installing regular requirements..."
    pip install -r requirements.txt
fi

echo "Collecting static files..."
# Collect static files (no database required)
python manage.py collectstatic --noinput

echo "Build completed successfully!"
echo "Migrations will be run during deployment..."

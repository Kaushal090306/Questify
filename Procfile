web: bash prestart.sh && gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --timeout 120 --max-requests 1000
release: python manage.py migrate --noinput

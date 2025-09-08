import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Beat Settings
app.conf.beat_schedule = {
    'generate-daily-practice-quizzes': {
        'task': 'core.tasks.generate_daily_practice_quizzes',
        'schedule': crontab(hour=6, minute=0),  # Run at 6:00 AM daily
    },
}

app.conf.timezone = 'UTC'

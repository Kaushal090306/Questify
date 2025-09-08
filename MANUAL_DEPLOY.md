# Manual Render Service Configuration

## Backend Service Configuration
**Service Type:** Web Service
**Environment:** Python 3
**Build Command:** 
```bash
pip install --upgrade pip && pip install -r requirements-deploy.txt && python manage.py collectstatic --noinput && python manage.py migrate --noinput
```

**Start Command:**
```bash
gunicorn backend.wsgi:application
```

**Environment Variables:**
- DJANGO_SECRET_KEY: [Your Django Secret Key]
- DATABASE_URL: [Auto-provided by Render Postgres]
- ALLOWED_HOSTS: .onrender.com
- GOOGLE_GEMINI_API_KEY: [Your Google Gemini API Key]
- DEBUG: False

## Frontend Service Configuration
**Service Type:** Static Site
**Build Command:**
```bash
cd frontend && npm install && npm run build
```

**Publish Directory:** frontend/build

**Environment Variables:**
- REACT_APP_SOCKETIO_URL: https://[your-backend-service-name].onrender.com

## Database Configuration
**Service Type:** PostgreSQL
**Plan:** Free
**Name:** questify-db

## Deployment Steps
1. Create PostgreSQL database first
2. Create backend web service with above config
3. Create frontend static site with above config
4. Update REACT_APP_SOCKETIO_URL with actual backend URL

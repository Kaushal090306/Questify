# Questify Deployment Guide for Render.com

## IMPORTANT: Gunicorn Command Fix

**Issue:** Render was trying to run `gunicorn app:app` instead of the correct Django command.

**Solutions:**
1. **Procfile created** with correct command: `web: gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT`
2. **render.yaml updated** with simplified startCommand
3. **start.sh script** created as backup

## Files Modified for Deployment

### 1. Requirements Fixed
- **requirements.txt**: Updated with core dependencies only
- **requirements-deploy.txt**: Minimal deployment requirements (avoids build issues)
- **runtime.txt**: Specifies Python 3.11.9 for Render

### 2. Code Changes
- **PyMuPDF → PyPDF2**: Replaced problematic PDF library
- **Optional PPTX Support**: Made python-pptx optional to avoid build issues
- **Optional OpenAI**: Made OpenAI import optional
- **CORS Settings**: Updated for production with Render domains
- **Fixed duplicate imports** in settings.py

### 3. Deployment Files
- **render.yaml**: Blueprint for automatic deployment
- **Procfile**: Backup deployment command
- **start.sh**: Alternative start script
- **MANUAL_DEPLOY.md**: Manual deployment instructions
- **.env.example**: Template for environment variables

## Deployment Options

### Option 1: Blueprint Deployment (Recommended)
1. Push all files to GitHub
2. Go to Render Dashboard → New → Blueprint
3. Connect repository → Render auto-detects render.yaml

### Option 2: Manual Deployment (If Blueprint fails)
1. Create services manually following MANUAL_DEPLOY.md
2. Use the specific build and start commands provided

## Environment Variables Required
- `DJANGO_SECRET_KEY`: Your Django secret key
- `GOOGLE_GEMINI_API_KEY`: Your Google Gemini API key
- `DATABASE_URL`: (Automatically provided by Render Postgres)
- `ALLOWED_HOSTS`: .onrender.com
- `DEBUG`: False

## Troubleshooting

### If you see "No module named 'app'" error:
✅ **Fixed:** Added Procfile with correct gunicorn command

### If build fails with package errors:
✅ **Fixed:** Use requirements-deploy.txt with minimal dependencies

### If static files don't load:
✅ **Fixed:** WhiteNoise configured in settings.py

## Post-Deployment
- Backend URL: `https://questify-backend.onrender.com`
- Frontend URL: `https://questify-frontend.onrender.com`
- Update REACT_APP_SOCKETIO_URL in frontend env vars

## Known Limitations on Free Tier
- Services sleep after 15 minutes of inactivity
- 750 hours/month limit
- No persistent disk storage
- Limited to basic features

Your deployment should now work correctly! 🚀

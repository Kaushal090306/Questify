# Questify Deployment Guide for Render.com

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

### 3. Deployment Files
- **render.yaml**: Blueprint for automatic deployment
- **build.sh**: Build script (backup)
- **.env.example**: Template for environment variables

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file

### 3. Set Environment Variables
In Render Dashboard, set these environment variables:
- `DJANGO_SECRET_KEY`: Your Django secret key
- `GOOGLE_GEMINI_API_KEY`: Your Google Gemini API key
- `DATABASE_URL`: (Automatically provided by Render Postgres)

### 4. Frontend Environment
Add to your React app environment:
- `REACT_APP_SOCKETIO_URL`: https://questify-backend.onrender.com

## Known Issues Fixed
- ❌ PyMuPDF build errors → ✅ PyPDF2 (lightweight)
- ❌ Pillow version conflicts → ✅ Latest stable Pillow
- ❌ Heavy dependencies → ✅ Minimal requirements
- ❌ Missing PPTX support → ✅ Optional with graceful fallback

## Features Available
- ✅ PDF document parsing
- ✅ DOCX document parsing  
- ⚠️ PPTX parsing (optional - can be enabled later)
- ✅ Quiz generation with Google Gemini
- ✅ Real-time multiplayer (Socket.IO)
- ✅ User authentication (JWT)
- ✅ Static file serving (WhiteNoise)

## Post-Deployment
- Your backend will be at: `https://questify-backend.onrender.com`
- Your frontend will be at: `https://questify-frontend.onrender.com`
- Database will be automatically configured

## Adding Optional Features Later
To enable PPTX support later, simply:
1. Add `python-pptx==0.6.21` to requirements.txt
2. Redeploy the service

This setup prioritizes reliability over features for the initial deployment.

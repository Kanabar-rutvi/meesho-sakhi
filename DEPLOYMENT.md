# Deployment Guide — Meesho Sakhi

This guide covers deploying Meesho Sakhi to production and fixing common "Server error: 404" issues.

## Local Development

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Step 1: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Add your Anthropic API key
# ANTHROPIC_API_KEY=sk-ant-v7-...

# Run backend on port 8000
uvicorn main:app --reload --port 8000
```

**Verify backend is running:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"ok","version":"2.0.0",...}
```

### Step 2: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cp .env.example .env.local

# For local dev, leave VITE_API_URL empty (uses Vite proxy)

# Start development server
npm run dev
# Opens at http://localhost:5173
```

**Test the setup:**
1. Open http://localhost:5173 in browser
2. Navigate to "Ask Sakhi" page
3. Submit a query like "Help me set up my hostel room"
4. You should see the agent pipeline running

---

## Production Deployment

### Option 1: Single Server (Recommended for Small Scale)

Deploy both frontend and backend on the same server.

#### Backend Setup
```bash
# On production server
cd /app/backend

# Install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env with production settings
cat > .env << EOF
HOST=0.0.0.0
PORT=8000
ENV=production
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
ANTHROPIC_API_KEY=sk-ant-...
EOF

# Run with production ASGI server (Gunicorn)
pip install gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Frontend Setup
```bash
cd /app/frontend

# Install dependencies
npm install

# Create .env.production
cat > .env.production << EOF
VITE_API_URL=https://yourdomain.com/api
EOF

# Build for production
npm run build

# Output in ./dist/ ready for static hosting
```

#### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend (React app)
    location / {
        root /app/frontend/dist;
        try_files $uri /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Direct backend endpoints (for /shop, /health, etc.)
    location ~ ^/(shop|health|meesho) {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}

# HTTP redirect
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### Update Frontend Environment Variables
After deployment, set the API URL in your Vite config or `.env` file:

```bash
# In frontend/.env.production
VITE_API_URL=https://yourdomain.com
# or if API is at a different domain:
VITE_API_URL=https://api.yourdomain.com
```

---

### Option 2: Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt gunicorn

COPY backend/ .

ENV HOST=0.0.0.0
ENV PORT=8000
EXPOSE 8000

CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine as builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
ARG VITE_API_URL=https://yourdomain.com
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production server
FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - ALLOWED_ORIGINS=http://frontend,https://yourdomain.com
      - DATABASE_URL=sqlite:///./meesho_sakhi.db
    volumes:
      - ./backend:/app/backend
    restart: unless-stopped

  frontend:
    build:
      context: ./
      dockerfile: Dockerfile.frontend
      args:
        VITE_API_URL: https://yourdomain.com
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: unless-stopped
```

---

## Fixing "Server error: 404"

### Root Cause
The 404 error occurs when:
1. Backend is not running
2. Frontend doesn't know where to call the backend API
3. CORS is not properly configured
4. API endpoint path is incorrect

### Solution Checklist

#### 1. Verify Backend is Running
```bash
# From your deployment server
curl http://localhost:8000/health

# Should return:
# {"status":"ok","version":"2.0.0",...}
```

If not running, start it:
```bash
cd /app/backend
source venv/bin/activate
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### 2. Check CORS Configuration
Backend `.env` must have correct `ALLOWED_ORIGINS`:

```bash
# For localhost development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:8000

# For production
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
```

#### 3. Set Frontend API URL
For production, environment variable must be set before build:

```bash
cd frontend

# Create .env.production
echo "VITE_API_URL=https://yourdomain.com" > .env.production

# Rebuild
npm run build
```

#### 4. Check Browser Console
Open browser Developer Tools (F12):
1. Go to Console tab
2. Look for CORS errors like: `Access to XMLHttpRequest blocked by CORS`
3. Check Network tab to see if request is being made to correct URL
4. Look for 404 response from backend

#### 5. Test API Endpoint Directly
```bash
# From your local machine or production server
curl -X POST https://yourdomain.com/shop \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}'

# Should NOT return 404
```

#### 6. Check Nginx Configuration
If using Nginx, ensure `/shop` endpoint is proxied correctly:

```nginx
location /shop {
    proxy_pass http://localhost:8000;
}
```

#### 7. Database and File Permissions
Ensure backend has write permissions:
```bash
chmod -R 755 /app/backend
chmod -R 755 /app/backend/backend  # For SQLite database
```

---

## Common Issues

### Issue: "Cannot find module 'catalog.json'"
**Solution:** Make sure `catalog.json` exists in backend root:
```bash
cd backend
ls -la catalog.json  # Should exist and have product data
```

### Issue: "ANTHROPIC_API_KEY not set"
**Solution:** Set API key in backend `.env`:
```bash
# Get your key from https://console.anthropic.com
echo "ANTHROPIC_API_KEY=sk-ant-v7-..." >> backend/.env
```

### Issue: Frontend shows "Client error" instead of "Server error"
**Solution:** Check browser console for CORS/networking errors. Usually means:
- Backend URL is wrong
- Backend is not accessible from frontend origin
- CORS headers are not set

### Issue: Works on localhost but not on production
**Solution:** Ensure:
1. `VITE_API_URL` is set to correct production domain
2. Frontend is rebuilt after setting env variable: `npm run build`
3. Backend `ALLOWED_ORIGINS` includes frontend domain
4. Both are accessible over HTTPS (not HTTP)

---

## Monitoring

### Check Backend Status
```bash
# Health endpoint
curl https://yourdomain.com/health

# API docs
https://yourdomain.com/docs
```

### View Logs
```bash
# If using Gunicorn with systemd
sudo journalctl -u meesho-sakhi-backend -f

# If using Docker
docker logs meesho-sakhi-backend -f
```

### Performance Tips
1. Enable gzip compression in Nginx
2. Set cache headers for static assets
3. Use CDN for frontend static files
4. Monitor API response times
5. Set up error tracking (Sentry, etc.)

---

## Questions?
- Check browser console (F12) for errors
- Check backend logs for detailed error messages
- Verify both frontend and backend are deployed and running
- Ensure environment variables are set correctly

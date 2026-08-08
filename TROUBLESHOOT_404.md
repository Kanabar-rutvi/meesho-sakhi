# Deployment Troubleshooting — "Server error: 404" After Deployment

## The Problem
After deployment, you're seeing "Server error: 404" when trying to use the shopping features. This means the frontend can't reach the backend API.

## Root Causes & Solutions

### ❌ Problem 1: Backend is Not Running
**Symptoms:** 404 error in browser, nothing in backend logs

**Solution:**
```bash
# SSH into your deployment server
ssh user@your-server.com

# Check if backend is running
ps aux | grep uvicorn
# or for Docker:
docker ps | grep meesho

# If not running, start it:
cd /app/backend
source venv/bin/activate
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 &

# Test backend directly:
curl http://localhost:8000/health
# Should return: {"status":"ok","version":"2.0.0",...}
```

---

### ❌ Problem 2: Frontend Doesn't Know Backend URL
**Symptoms:** Frontend tries to call `http://yourdomain.com/shop` instead of correct backend URL

**Solution:**

#### Step 1: Determine Your Backend URL
Where is your backend running?

**Option A: Same server, different port**
```
Frontend: https://yourdomain.com
Backend: https://yourdomain.com:8000
→ Set VITE_API_URL=https://yourdomain.com:8000
```

**Option B: Same server, same port (via reverse proxy)**
```
Frontend: https://yourdomain.com
Backend: https://yourdomain.com (proxied to :8000)
→ Set VITE_API_URL=https://yourdomain.com
```

**Option C: Different domain**
```
Frontend: https://yourdomain.com
Backend: https://api.yourdomain.com
→ Set VITE_API_URL=https://api.yourdomain.com
```

**Option D: Same domain, API path**
```
Frontend: https://yourdomain.com
Backend at: https://yourdomain.com/api
→ Set VITE_API_URL=https://yourdomain.com/api
```

#### Step 2: Rebuild Frontend with Correct URL

```bash
cd frontend

# Set environment variable
export VITE_API_URL=https://your-backend-url  # Use your actual backend URL

# Rebuild
npm run build

# Upload dist/ folder to your web server
rsync -avz dist/ user@your-server.com:/var/www/meesho-sakhi/
```

#### Step 3: Verify in Browser
1. Open your deployed site in browser
2. Open Developer Console (F12)
3. Go to Network tab
4. Try to generate recommendations
5. Look for the `/shop` request
6. Check where it's trying to call (should be your backend URL)

---

### ❌ Problem 3: CORS Errors
**Symptoms:** Console shows "CORS error" or "blocked by CORS policy"

**Solution:**

Update backend `.env` to include your frontend domain:

```bash
# Backend .env
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com,https://yourdomain.com:8000

# Restart backend
# If using supervisor:
sudo supervisorctl restart meesho-sakhi-backend

# If using Docker:
docker-compose restart backend
```

---

### ❌ Problem 4: Reverse Proxy Not Configured
**Symptoms:** API calls fail when using same domain

**Solution:**

If frontend and backend are on same domain, configure Nginx:

```nginx
# /etc/nginx/sites-available/meesho-sakhi

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend (React app)
    location / {
        root /var/www/meesho-sakhi;
        try_files $uri /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Backend API routes
    location /shop {
        proxy_pass http://127.0.0.1:8000;
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

    location /meesho {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Then restart Nginx:
```bash
sudo systemctl restart nginx
```

---

## Step-by-Step Debugging

### 1. Check Backend Health
```bash
# From your deployment server
curl http://localhost:8000/health

# Expected response:
# {"status":"ok","version":"2.0.0","catalog_size":68,"features":[...]}
```

### 2. Check Frontend Logs
Open browser DevTools (F12):
1. Go to **Console** tab
2. Look for messages starting with `[Meesho Sakhi]`
3. You'll see the API URL being used
4. Go to **Network** tab
5. Try to generate recommendations
6. Look for the `/shop` request
7. Check the Response and see what error it returns

### 3. Test API Directly
From your computer:
```bash
curl -X POST https://yourdomain.com/shop \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}'

# Should NOT return 404
# Should return Server-Sent Events stream
```

### 4. Check Server Logs
```bash
# If using Gunicorn with systemd:
sudo journalctl -u meesho-sakhi -n 50 -f

# If using Docker Compose:
docker-compose logs -f backend

# Check Nginx logs:
sudo tail -50 /var/log/nginx/error.log
sudo tail -50 /var/log/nginx/access.log
```

---

## Common Deployment Scenarios

### Scenario 1: Backend on Same Server, Different Port
```bash
# Build frontend
cd frontend
export VITE_API_URL=https://yourdomain.com:8000
npm run build

# Frontend: :80 (Nginx)
# Backend: :8000 (Gunicorn)
```

### Scenario 2: Backend on Different Subdomain
```bash
# Build frontend
cd frontend
export VITE_API_URL=https://api.yourdomain.com
npm run build

# Frontend: yourdomain.com
# Backend: api.yourdomain.com (different server)

# Update backend .env:
ALLOWED_ORIGINS=https://yourdomain.com,https://api.yourdomain.com
```

### Scenario 3: Everything Behind One Nginx
```bash
# Build frontend with same origin
cd frontend
export VITE_API_URL=https://yourdomain.com
npm run build

# Nginx config proxies /shop to backend:8000
# Restart Nginx
sudo systemctl restart nginx
```

---

## Final Checklist

- [ ] Backend is running: `curl http://localhost:8000/health` returns 200
- [ ] Frontend built with correct VITE_API_URL
- [ ] Browser console shows correct API URL: `[Meesho Sakhi] API Base URL: ...`
- [ ] CORS is configured: `ALLOWED_ORIGINS` includes frontend domain
- [ ] Reverse proxy is configured (if needed)
- [ ] SSL certificates are valid
- [ ] Firewall allows traffic between frontend and backend
- [ ] Network tab in DevTools shows `/shop` request going to correct URL
- [ ] Backend responds to test API call: `curl -X POST https://yourdomain.com/shop ...`

---

## Still Having Issues?

Share the following information:

1. **Deployment setup:**
   - Frontend domain: `https://...`
   - Backend domain/port: `https://...` or `http://...:port`
   - Same server or different servers?

2. **Build command used:**
   ```bash
   echo $VITE_API_URL  # What was set during build?
   ```

3. **Browser console output:**
   - Open F12 → Console
   - Copy the `[Meesho Sakhi]` messages
   - Copy any error messages

4. **Backend health check:**
   ```bash
   curl http://localhost:8000/health
   ```

5. **Test API call result:**
   ```bash
   curl -X POST https://yourdomain.com/shop \
     -H "Content-Type: application/json" \
     -d '{"query":"test"}'
   ```

This information will help diagnose the exact issue!

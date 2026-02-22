# Blueprint Upload 413 Error Fix

## Problem
Users were receiving HTTP 413 (Payload Too Large) errors when uploading blueprint files.

## Root Causes

1. **Nginx** — Missing `client_max_body_size` directive (defaulting to 1MB)
2. **Express** — Body parser limits set to 10MB, but blueprints can be up to 100MB
3. **Request Size Limiter** — Inconsistent limit (110MB check but 50MB error message)
4. **Frontend** — Text showed "Max 50MB" but actual limit is 100MB

## Changes Made

### 1. Nginx Configuration (`nginx.conf`)
```nginx
# Maximum upload size for blueprints
client_max_body_size 100M;

# In API location block
location /api/ {
    client_max_body_size 100M;
    ...
}
```

### 2. Express Server (`backend/src/server.js`)
```javascript
// Increased from 10mb to 100mb
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
```

### 3. Security Middleware (`backend/src/middleware/security.js`)
```javascript
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

// Updated error message and added code field
return res.status(413).json({
  error: 'Request size too large. Maximum 100MB allowed.',
  maxSize: '100MB',
  code: 'PAYLOAD_TOO_LARGE'
});
```

### 4. Frontend - BlueprintUpload (`frontend/src/components/pricing/BlueprintUpload.jsx`)
- Added frontend file size validation (100MB)
- Updated UI text from "Max 50MB" to "Max 100MB"
- Improved error handling for 413 errors

### 5. Frontend - Vision API (`frontend/src/api/vision.js`)
- Added 413 error handling in response interceptor
- Better error messages for file size violations

## Upload Limits by Location

| Location | Limit | Notes |
|----------|-------|-------|
| `/api/upload/blueprint` | 50MB | Blueprint analysis (PDF only) |
| `/api/vision/upload` | 100MB | Vision deep-zoom (images + PDF) |

## Testing

To test the fix:

1. **Small file (< 50MB)** — Should upload successfully
2. **Medium file (50-100MB)** — Works for Vision, fails for Blueprint analysis with clear message
3. **Large file (> 100MB)** — Frontend validation prevents upload with clear error message

## Deployment Notes

After deploying these changes:

1. Restart nginx: `sudo nginx -s reload`
2. Restart backend: `npm run dev` or `pm2 restart`
3. Clear browser cache for frontend changes

## Error Messages

Users will now see:
- **Frontend validation**: "File too large. Maximum size is 100MB. Your file is X MB."
- **Server response**: "Request size too large. Maximum 100MB allowed."

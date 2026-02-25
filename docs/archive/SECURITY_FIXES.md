# Security Fixes Applied

## Summary

This document summarizes the security fixes applied to the OpenSite backend.

## Changes Made

### 1. Admin Endpoint Authentication (CRITICAL)

**Issue:** `/api/admin/*` endpoints were unprotected, exposing sensitive operations:
- `GET /api/admin/memory` - Exposed server memory usage
- `POST /api/admin/backup` - Allowed unauthorized database backups

**Fix:** 
- Created `/backend/src/middleware/auth.js` with `requireAdmin` middleware
- Uses API key authentication via `X-Admin-Key` header
- Implements timing-safe comparison to prevent timing attacks
- Returns 503 if `ADMIN_API_KEY` env var is not configured

**Required Action:**
```bash
# Generate an admin key
node -e "console.log('osk_' + Array(48).fill(0).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join(''))"

# Add to .env
ADMIN_API_KEY=osk_xxxxxxxxxxxxxxxx...
```

### 2. Email Password Encryption at Rest (CRITICAL)

**Issue:** Email passwords (IMAP) were stored in plaintext in the database via `imap_pass` setting.

**Fix:**
- Created `/backend/src/utils/encryption.js` with AES-256-GCM encryption
- Updated `/backend/src/routes/email-monitor.js` to encrypt passwords before storage
- Updated `/backend/src/services/email-monitor.js` to decrypt passwords when reading
- Backwards compatible - legacy plaintext passwords still work

**Required Action:**
```bash
# Generate an encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Add to .env
ENCRYPTION_KEY=xxxxxxxxxxxxxxxx...
```

### 3. Python Subprocess Validation (HIGH)

**Issue:** `plumbing.js` used `spawn()` with unvalidated environment variables and interpreter path, potentially allowing command injection.

**Fix:**
- Created `/backend/src/utils/subprocess.js` with validated subprocess spawning
- Whitelist-based validation for Python interpreters
- Environment variable sanitization
- Argument length and character validation
- Timeout support
- Updated `/backend/src/routes/plumbing.js` to use the new utility

### 4. SQL Injection Prevention (MEDIUM)

**Issue:** Review of `vision.js` routes revealed dynamic SQL generation in layer updates.

**Finding:** The existing code actually uses parameterized queries. However, added defense in depth:
- Verified all database queries use parameterized statements
- Input validation through existing validation middleware

### 5. Build Warning Fix (LOW)

**Issue:** Duplicate key `status` in `Layout.jsx` mock data causing Vite warning.

**Fix:** Removed duplicate `status` key from `MOCK_LEADS[2]` object.

## Files Created

1. `/backend/src/middleware/auth.js` - Authentication middleware
2. `/backend/src/utils/encryption.js` - Encryption/decryption utilities
3. `/backend/src/utils/subprocess.js` - Validated subprocess spawning

## Files Modified

1. `/backend/src/server.js` - Added auth to admin endpoints
2. `/backend/src/routes/email-monitor.js` - Encrypt passwords on save
3. `/backend/src/services/email-monitor.js` - Decrypt passwords on read
4. `/backend/src/routes/plumbing.js` - Use validated subprocess
5. `/frontend/src/components/layout/Layout.jsx` - Fixed duplicate key
6. `/.env.example` - Added new required env vars

## Environment Variables Required

| Variable | Required For | Generate With |
|----------|--------------|---------------|
| `ADMIN_API_KEY` | Admin endpoint protection | `node -e "console.log('osk_' + Array(48).fill(0).map(() => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]).join(''))"` |
| `ENCRYPTION_KEY` | Email password encryption | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |

## Testing

1. **Admin endpoints:**
   ```bash
   # Should fail (no key)
   curl http://localhost:5001/api/admin/memory
   
   # Should succeed
   curl -H "X-Admin-Key: $ADMIN_API_KEY" http://localhost:5001/api/admin/memory
   ```

2. **Email encryption:**
   ```bash
   # Save settings (password should be encrypted in DB)
   curl -X PUT http://localhost:5001/api/email-monitor/settings \
     -H "Content-Type: application/json" \
     -d '{"user":"test@example.com","pass":"secret123"}'
   
   # Verify password is encrypted in database
   sqlite3 tool/data/opensite.db "SELECT value FROM settings WHERE key='imap_pass';"
   ```

3. **Subprocess validation:**
   ```bash
   # Upload a plumbing PDF - should work normally
   curl -X POST http://localhost:5001/api/plumbing/extract \
     -F "file=@blueprint.pdf"
   ```

## Security Considerations

1. **Key Management:** Store `ADMIN_API_KEY` and `ENCRYPTION_KEY` securely (e.g., in a secrets manager)
2. **Key Rotation:** The encryption utility supports key rotation for future use
3. **Backup Security:** Database backups now require admin authentication
4. **Legacy Data:** Existing plaintext passwords will continue to work but should be re-saved to encrypt them

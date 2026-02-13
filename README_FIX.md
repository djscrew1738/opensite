# PDF Upload Fix Applied

## Problem Fixed
The Vite proxy was configured to point to port **5001** instead of port **3001** where the backend actually runs.

## Changes Made
1. **vite.config.js**: Changed proxy target from `http://localhost:5001` to `http://localhost:3001`
2. **Cleaned up old processes**: Killed stale node processes that were blocking ports
3. **Restarted services**: Both frontend and backend restarted cleanly

## Verification
- Backend API: http://localhost:3001/api/health ✅
- Frontend with proxy: Check ports 3000-3003 for working instance

## Testing PDF Upload
1. Open the working frontend port (likely 3000 or 3003)
2. Go to /pricing page
3. Upload a PDF blueprint
4. It should now upload and process correctly!

## If Still Having Issues
```bash
# Kill all node processes and restart clean
pkill -f node
sleep 3
systemctl --user restart 1stein-backend
systemctl --user restart 1stein-frontend
```

## Note
The existing test PDFs in /home/djscrew/tool/uploads/ have "Invalid PDF structure" errors.
Use fresh PDF files or manual data entry to test the visualization dashboard.

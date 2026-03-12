#!/usr/bin/env node
/**
 * Simple combined server for Cloudflare tunnel
 * Serves frontend static files and proxies API requests to backend
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3999;
const BACKEND_URL = 'http://127.0.0.1:5001';
const FRONTEND_DIR = path.join(__dirname, 'frontend/dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Proxy API requests to backend
  if (req.url.startsWith('/api/')) {
    try {
      const backendReq = http.request(
        `${BACKEND_URL}${req.url}`,
        {
          method: req.method,
          headers: {
            ...req.headers,
            host: 'localhost:5001',
          },
        },
        (backendRes) => {
          res.writeHead(backendRes.statusCode, backendRes.headers);
          backendRes.pipe(res);
        }
      );
      
      backendReq.on('error', (err) => {
        console.error('Backend proxy error:', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: { message: 'Backend unavailable', code: 'BACKEND_ERROR' }
        }));
      });
      
      req.pipe(backendReq);
    } catch (err) {
      console.error('Proxy error:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' }
      }));
    }
    return;
  }

  // Serve static files
  let filePath = path.join(FRONTEND_DIR, req.url === '/' ? 'index.html' : req.url);
  
  // SPA fallback - if file doesn't exist, serve index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(FRONTEND_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found - serve index.html for SPA
        fs.readFile(path.join(FRONTEND_DIR, 'index.html'), (err2, content2) => {
          if (err2) {
            res.writeHead(500);
            res.end('Server Error');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content2);
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      // Add caching headers for static assets
      const headers = { 'Content-Type': contentType };
      if (ext === '.js' || ext === '.css' || ext === '.png' || ext === '.jpg' || ext === '.woff' || ext === '.woff2') {
        headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      }
      res.writeHead(200, headers);
      res.end(content);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Tunnel server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Serving frontend from: ${FRONTEND_DIR}`);
  console.log(`🔌 Proxying API to: ${BACKEND_URL}`);
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
  process.exit(1);
});

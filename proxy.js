#!/usr/bin/env node
/**
 * Simple HTTP Reverse Proxy for AIMAK
 * Proxies requests from port 80 to the appropriate backend services
 */

const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');

const proxy = httpProxy.createProxyServer({});

// MIME types for static files
const mimeTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

// Uploads directory
const UPLOADS_DIR = process.env.UPLOAD_DIR || '/var/www/html/uploads';

// Error handling
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway: Unable to connect to backend service');
  }
});

// Serve static files from uploads directory
function serveStaticFile(req, res, filePath) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'public, max-age=31536000',
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = req.url;
  const host = req.headers.host;

  console.log(`${new Date().toISOString()} - ${req.method} ${url} from ${req.headers['x-real-ip'] || req.socket.remoteAddress}`);

  // Route API requests to port 4000
  if (url.startsWith('/api') || url.startsWith('/socket.io')) {
    proxy.web(req, res, {
      target: 'http://127.0.0.1:4000',
      changeOrigin: true,
    });
  }
  // Serve uploads as static files
  else if (url.startsWith('/uploads/')) {
    const filename = url.replace('/uploads/', '').split('?')[0];
    const filePath = path.join(UPLOADS_DIR, filename);
    serveStaticFile(req, res, filePath);
  }
  // Route everything else to Next.js on port 3000
  else {
    proxy.web(req, res, {
      target: 'http://127.0.0.1:3000',
      changeOrigin: true,
      ws: true,
    });
  }
});

// Handle WebSocket upgrades
server.on('upgrade', (req, socket, head) => {
  const url = req.url;

  if (url.startsWith('/api') || url.startsWith('/socket.io')) {
    proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:4000' });
  } else {
    proxy.ws(req, socket, head, { target: 'ws://127.0.0.1:3000' });
  }
});

const PORT = 80;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Reverse proxy listening on port ${PORT}`);
  console.log(`Proxying /api -> http://127.0.0.1:4000`);
  console.log(`Serving /uploads from ${UPLOADS_DIR}`);
  console.log(`Proxying /* -> http://127.0.0.1:3000`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

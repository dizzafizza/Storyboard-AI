/**
 * Simple Express server for development with proper security headers
 * Run with: node server.js
 */

import express from 'express';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Security headers middleware
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https:;
    font-src 'self' data:;
    connect-src 'self' https://api.openai.com https://oaidalleapiprodscus.blob.core.windows.net;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
  `.replace(/\n/g, ' '));
  
  next();
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Proxy for OpenAI API
app.use('/openai-proxy', (req, res) => {
  // Handle both /openai-proxy and /openai-proxy/ paths
  let targetPath = req.url;
  
  // Ensure path starts with /v1 for OpenAI API
  if (!targetPath.startsWith('/v1')) {
    if (targetPath === '/' || targetPath === '') {
      targetPath = '/v1';
    } else {
      targetPath = '/v1' + targetPath;
    }
  }
  
  const targetUrl = `https://api.openai.com${targetPath}`;
  console.log(`Proxying request to: ${targetUrl}`);
  console.log(`Request method: ${req.method}, Path: ${targetPath}`);
  
  // Forward the request
  const proxyReq = https.request(
    targetUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'api.openai.com',
      },
    },
    (proxyRes) => {
      // Copy status code
      res.statusCode = proxyRes.statusCode;
      
      // Copy headers
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        res.setHeader(key, value);
      }
      
      // Pipe response
      proxyRes.pipe(res);
    }
  );
  
  // Pipe request body
  req.pipe(proxyReq);
  
  // Handle errors
  proxyReq.on('error', (error) => {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error');
  });
});

// Proxy for OpenAI image downloads
app.use('/image-proxy', (req, res) => {
  // Handle both /image-proxy and /image-proxy/ paths
  let targetPath = req.url;
  if (targetPath === '/' || targetPath === '') {
    targetPath = '';
  }
  
  const targetUrl = `https://oaidalleapiprodscus.blob.core.windows.net${targetPath}`;
  console.log(`Proxying image request to: ${targetUrl}`);
  
  // Forward the request
  const proxyReq = https.request(
    targetUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: 'oaidalleapiprodscus.blob.core.windows.net',
      },
    },
    (proxyRes) => {
      // Copy status code
      res.statusCode = proxyRes.statusCode;
      
      // Copy headers
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        res.setHeader(key, value);
      }
      
      // Pipe response
      proxyRes.pipe(res);
    }
  );
  
  // Pipe request body
  req.pipe(proxyReq);
  
  // Handle errors
  proxyReq.on('error', (error) => {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error');
  });
});

// All other routes should serve the index.html
app.get('*', (req, res) => {
  // Check if the request is for a static asset
  if (req.url.startsWith('/Storyboard-AI/assets/')) {
    // Rewrite the path to serve from the correct location
    const assetPath = req.url.replace('/Storyboard-AI/assets/', '/assets/');
    res.sendFile(path.join(__dirname, 'dist', assetPath));
  } else {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`✅ Security headers and proxy enabled`);
}); 
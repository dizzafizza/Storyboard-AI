/**
 * Simple Express server for development with proper security headers
 * Run with: npm run serve
 */

const express = require('express');
const path = require('path');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

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
  const url = 'https://api.openai.com' + req.url;
  console.log(`Proxying request to: ${url}`);
  
  // Forward the request
  const proxyReq = https.request(
    url,
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
  const url = 'https://oaidalleapiprodscus.blob.core.windows.net' + req.url;
  console.log(`Proxying image request to: ${url}`);
  
  // Forward the request
  const proxyReq = https.request(
    url,
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
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`✅ Security headers and proxy enabled`);
}); 
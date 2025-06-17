/**
 * This script fixes the OpenAI API path issues in server.js
 * Run with: node fix-server.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing server.js to handle OpenAI API paths correctly...');

// Path to server.js
const serverJsPath = path.join(__dirname, 'server.js');

// Check if the file exists
if (!fs.existsSync(serverJsPath)) {
  console.error('❌ Error: server.js file not found at:', serverJsPath);
  process.exit(1);
}

// Read the file
let content = fs.readFileSync(serverJsPath, 'utf8');

// Define the patch for the OpenAI proxy handler
const originalProxyHandler = `// Proxy for OpenAI API
app.use('/openai-proxy', (req, res) => {
  // Handle both /openai-proxy and /openai-proxy/ paths
  let targetPath = req.url;
  if (targetPath === '/' || targetPath === '') {
    targetPath = '';
  }
  
  const targetUrl = \`https://api.openai.com\${targetPath}\`;
  console.log(\`Proxying request to: \${targetUrl}\`);
  console.log(\`Request method: \${req.method}, Headers:\`, req.headers);`;

const patchedProxyHandler = `// Proxy for OpenAI API
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
  
  const targetUrl = \`https://api.openai.com\${targetPath}\`;
  console.log(\`Proxying request to: \${targetUrl}\`);
  console.log(\`Request method: \${req.method}, Path: \${targetPath}\`);`;

// Replace the proxy handler
if (content.includes(originalProxyHandler)) {
  content = content.replace(originalProxyHandler, patchedProxyHandler);
  
  // Write the patched file
  fs.writeFileSync(serverJsPath, content, 'utf8');
  console.log('✅ Successfully patched server.js with OpenAI API path fix!');
} else {
  console.error('❌ Could not find the OpenAI proxy handler in server.js. The file might have changed.');
  process.exit(1);
}

console.log('✅ Fix complete! Restart the server to apply changes.');

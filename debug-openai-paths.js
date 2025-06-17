/**
 * This script helps debug the OpenAI API paths
 * Run with: node debug-openai-paths.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Debugging OpenAI API paths');

// Create a simple HTML file that tests the OpenAI API paths
const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>OpenAI API Path Debug</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; }
    button { padding: 8px 16px; margin: 5px; background: #0066ff; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .result { margin-top: 10px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; }
    .error { color: red; }
    .success { color: green; }
  </style>
</head>
<body>
  <h1>OpenAI API Path Debug</h1>
  
  <div>
    <h2>Test Direct API Connection</h2>
    <button id="testDirectBtn">Test Direct OpenAI API</button>
    <div id="directResult" class="result">Results will appear here</div>
  </div>

  <div>
    <h2>Test Proxy API Connection</h2>
    <button id="testProxyBtn">Test Proxy OpenAI API</button>
    <div id="proxyResult" class="result">Results will appear here</div>
  </div>

  <div>
    <h2>Test URL Construction</h2>
    <button id="testUrlBtn">Test URL Construction</button>
    <div id="urlResult" class="result">Results will appear here</div>
  </div>

  <script>
    // Test direct OpenAI API
    document.getElementById('testDirectBtn').addEventListener('click', async function() {
      const resultDiv = document.getElementById('directResult');
      resultDiv.innerHTML = 'Testing direct OpenAI API...';
      resultDiv.className = 'result';
      
      try {
        // This will fail due to CORS, but we can see the request
        const response = await fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_API_KEY_PLACEHOLDER'
          }
        });
        
        const data = await response.json();
        resultDiv.innerHTML = '<span class="success">Success!</span><pre>' + JSON.stringify(data, null, 2) + '</pre>';
      } catch (e) {
        resultDiv.innerHTML = '<span class="error">Error:</span> ' + e.message + '<br><br>This is expected due to CORS, but the request was made.';
      }
    });

    // Test proxy OpenAI API
    document.getElementById('testProxyBtn').addEventListener('click', async function() {
      const resultDiv = document.getElementById('proxyResult');
      resultDiv.innerHTML = 'Testing proxy OpenAI API...';
      resultDiv.className = 'result';
      
      try {
        // Test with our proxy
        const response = await fetch('/openai-proxy/v1/models', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_API_KEY_PLACEHOLDER'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          resultDiv.innerHTML = '<span class="success">Success!</span><pre>' + JSON.stringify(data, null, 2) + '</pre>';
        } else {
          const text = await response.text();
          resultDiv.innerHTML = '<span class="error">Error ' + response.status + ':</span><pre>' + text + '</pre>';
        }
      } catch (e) {
        resultDiv.innerHTML = '<span class="error">Error:</span> ' + e.message;
      }
    });

    // Test URL construction
    document.getElementById('testUrlBtn').addEventListener('click', function() {
      const resultDiv = document.getElementById('urlResult');
      resultDiv.innerHTML = 'Testing URL construction...';
      resultDiv.className = 'result';
      
      try {
        const tests = [
          { input: '/openai-proxy/v1/chat/completions', base: null },
          { input: '/openai-proxy/v1/chat/completions', base: window.location.origin },
          { input: 'v1/chat/completions', base: 'https://api.openai.com/' },
          { input: 'v1/chat/completions', base: 'https://api.openai.com' },
          { input: '/v1/chat/completions', base: 'https://api.openai.com' },
          { input: 'chat/completions', base: 'https://api.openai.com/v1/' }
        ];
        
        let results = '';
        tests.forEach(test => {
          try {
            const url = test.base ? new URL(test.input, test.base) : new URL(test.input);
            results += '<div><strong>Input:</strong> ' + test.input + 
                      (test.base ? ' <strong>Base:</strong> ' + test.base : '') + 
                      ' <strong>Result:</strong> <span class="success">' + url.toString() + '</span></div>';
          } catch (e) {
            results += '<div><strong>Input:</strong> ' + test.input + 
                      (test.base ? ' <strong>Base:</strong> ' + test.base : '') + 
                      ' <strong>Result:</strong> <span class="error">' + e.message + '</span></div>';
          }
        });
        
        resultDiv.innerHTML = results;
      } catch (e) {
        resultDiv.innerHTML = '<span class="error">Error:</span> ' + e.message;
      }
    });
  </script>
</body>
</html>
`;

// Write the test file
fs.writeFileSync(path.join(__dirname, 'debug-openai.html'), testHtml, 'utf8');
console.log('✅ Created debug HTML file: debug-openai.html');

// Create a fix for the server.js file
const serverFixJs = `/**
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
const originalProxyHandler = \`// Proxy for OpenAI API
app.use('/openai-proxy', (req, res) => {
  // Handle both /openai-proxy and /openai-proxy/ paths
  let targetPath = req.url;
  if (targetPath === '/' || targetPath === '') {
    targetPath = '';
  }
  
  const targetUrl = \\\`https://api.openai.com\\\${targetPath}\\\`;
  console.log(\\\`Proxying request to: \\\${targetUrl}\\\`);
  console.log(\\\`Request method: \\\${req.method}, Headers:\\\`, req.headers);\`;

const patchedProxyHandler = \`// Proxy for OpenAI API
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
  
  const targetUrl = \\\`https://api.openai.com\\\${targetPath}\\\`;
  console.log(\\\`Proxying request to: \\\${targetUrl}\\\`);
  console.log(\\\`Request method: \\\${req.method}, Path: \\\${targetPath}\\\`);\`;

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
`;

// Write the fix script
fs.writeFileSync(path.join(__dirname, 'fix-server.js'), serverFixJs, 'utf8');
console.log('✅ Created server fix script: fix-server.js');

console.log('\nTo fix the issue:');
console.log('1. Run: node fix-server.js');
console.log('2. Start the server: node server.js');
console.log('3. Open debug-openai.html in your browser to test API paths'); 
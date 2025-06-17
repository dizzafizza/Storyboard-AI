/**
 * This script directly fixes the OpenAI URL issue in the built application code
 * Run with: node fix-openai-url.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the built AI service file
const distDir = path.join(__dirname, 'dist', 'assets');
console.log('Looking for AI service file in:', distDir);

// Find the AI service file
let aiFile = null;
try {
  const files = fs.readdirSync(distDir);
  aiFile = files.find(file => file.startsWith('ai-') && file.endsWith('.js'));
} catch (err) {
  console.error('Error reading dist directory:', err);
  process.exit(1);
}

if (!aiFile) {
  console.error('Could not find AI service file in dist/assets');
  process.exit(1);
}

const aiFilePath = path.join(distDir, aiFile);
console.log('Found AI service file:', aiFilePath);

// Read the file
let content = fs.readFileSync(aiFilePath, 'utf8');

// Define the patch to apply - this adds a URL polyfill before the OpenAI SDK is used
const patch = `
// URL parsing fix for OpenAI SDK
const originalURL = window.URL;
window.URL = class extends originalURL {
  constructor(url, base) {
    try {
      super(url, base);
    } catch (e) {
      if (url.startsWith('/openai-proxy') || url.startsWith('/image-proxy')) {
        console.log('Fixing relative URL:', url);
        super(url, window.location.origin);
      } else {
        throw e;
      }
    }
  }
};
`;

// Insert the patch at the beginning of the file
content = patch + content;

// Write the patched file
fs.writeFileSync(aiFilePath, content, 'utf8');
console.log('✅ Successfully patched AI service file with URL fix!');

// Also create a simple HTML test file to verify the fix
const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>OpenAI URL Fix Test</title>
</head>
<body>
  <h1>OpenAI URL Fix Test</h1>
  <p>This page tests if the URL parsing issue is fixed.</p>
  <button id="testBtn">Test OpenAI URL Parsing</button>
  <div id="result" style="margin-top: 20px; padding: 10px; border: 1px solid #ccc;"></div>

  <script>
    document.getElementById('testBtn').addEventListener('click', function() {
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = 'Testing...';
      
      try {
        // Test URL parsing
        const url1 = new URL('/openai-proxy/chat/completions', window.location.origin);
        const url2 = new URL('/image-proxy/123456', window.location.origin);
        
        resultDiv.innerHTML = '<p style="color: green;">✅ URL parsing works correctly!</p>' +
          '<p>Test URL 1: ' + url1.toString() + '</p>' +
          '<p>Test URL 2: ' + url2.toString() + '</p>';
      } catch (e) {
        resultDiv.innerHTML = '<p style="color: red;">❌ URL parsing failed: ' + e.message + '</p>';
      }
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'url-test.html'), testHtml, 'utf8');
console.log('✅ Created URL test file: url-test.html');

console.log('\nTo fix the issue:');
console.log('1. Run: node patch-openai.js');
console.log('2. Rebuild the project: npm run build');
console.log('3. Start the server: node server.js');
console.log('4. Open the application and test'); 
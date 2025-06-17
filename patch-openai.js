/**
 * This script patches the OpenAI SDK to fix URL parsing issues
 * Run with: node patch-openai.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the OpenAI SDK core file
const openaiCorePath = path.join(__dirname, 'node_modules', 'openai', 'core.js');

console.log('Patching OpenAI SDK to fix URL parsing issues...');

// Check if the file exists
if (!fs.existsSync(openaiCorePath)) {
  console.error('Error: OpenAI SDK core.js file not found at:', openaiCorePath);
  process.exit(1);
}

// Read the file
let content = fs.readFileSync(openaiCorePath, 'utf8');

// Find the buildURL function and modify it to handle relative URLs
const originalBuildURL = `function buildURL(url, query) {
    const resolvedUrl = new URL(url);`;

const patchedBuildURL = `function buildURL(url, query) {
    // Fix for relative URLs
    let resolvedUrl;
    try {
      // Try to parse as a complete URL
      resolvedUrl = new URL(url);
    } catch (e) {
      // If parsing fails, assume it's a relative URL and prepend the origin
      if (typeof window !== 'undefined') {
        resolvedUrl = new URL(url, window.location.origin);
        console.log('OpenAI SDK: Converted relative URL to absolute:', resolvedUrl.toString());
      } else {
        // In Node.js environment, we need a base URL
        throw new Error(\`Cannot parse relative URL "\${url}" without a base URL. Please use absolute URLs.\`);
      }
    }`;

// Replace the function
if (content.includes(originalBuildURL)) {
  content = content.replace(originalBuildURL, patchedBuildURL);
  
  // Write the patched file
  fs.writeFileSync(openaiCorePath, content, 'utf8');
  console.log('✅ Successfully patched OpenAI SDK!');
} else {
  console.error('❌ Could not find the buildURL function in the OpenAI SDK. The SDK might have changed.');
  process.exit(1);
} 
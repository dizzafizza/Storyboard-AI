#!/bin/bash

# This script builds and patches the application without starting the server

echo "🔨 Building the application..."
npm run build

echo "🔧 Applying URL fix patch..."
node fix-openai-url.js

echo "✅ Setup complete! To start the server, run: node server.js" 
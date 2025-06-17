#!/bin/bash

# Kill any existing servers
echo "Stopping any existing servers..."
pkill -f "node server.js" || true
pkill -f "npm run dev" || true

# Start the development server
echo "Starting development server..."
npm run dev 
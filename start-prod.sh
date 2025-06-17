#!/bin/bash

# Kill any existing servers
echo "Stopping any existing servers..."
pkill -f "node server.js" || true
pkill -f "npm run dev" || true

# Build the project
echo "Building the project..."
npm run build

# Start the production server
echo "Starting production server..."
node server.js 
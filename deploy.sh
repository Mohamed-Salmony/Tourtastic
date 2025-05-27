#!/bin/bash

# Exit on error
set -e

echo "Starting deployment process..."

# Install dependencies for client
echo "Installing client dependencies..."
cd client
npm install

# Build the client
echo "Building client..."
npm run build

# Move back to root
cd ..

# Install dependencies for server
echo "Installing server dependencies..."
cd server
npm install

# Start the server
echo "Starting server..."
npm start

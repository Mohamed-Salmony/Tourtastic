#!/bin/bash

# Exit on any error
set -e

echo "Starting deployment process..."

# Install dependencies in client directory
echo "Installing client dependencies..."
cd ../client
npm install

# Build the client
echo "Building client..."
npm run build

# Create public directory in server
echo "Setting up server public directory..."
cd ../server
mkdir -p public

# Copy build files to server/public
echo "Copying build files to server..."
cp -r ../client/dist/* public/

echo "Deployment preparation complete!"

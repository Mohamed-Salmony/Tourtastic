# Build and deploy script for Tourtastic
Write-Host "Starting deployment process..."

# Install dependencies in client directory
Write-Host "Installing client dependencies..."
Set-Location -Path "../client"
npm install

# Build the client
Write-Host "Building client..."
npm run build

# Create public directory in server and copy files
Write-Host "Setting up server public directory..."
Set-Location -Path "../server"
New-Item -ItemType Directory -Force -Path "public"

# Copy build files to server/public
Write-Host "Copying build files to server..."
Copy-Item -Path "../client/dist/*" -Destination "public/" -Recurse -Force

Write-Host "Deployment preparation complete!"

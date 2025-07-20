#!/bin/bash
# Cloudflare Pages build script

echo "Building Dynamic Link Downloader for Cloudflare Pages..."

# Navigate to client directory
cd client

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building Next.js application..."
npm run build

echo "Build complete! Output directory: client/out"

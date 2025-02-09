#!/bin/bash
set -x  # Enable command printing for debugging

echo "Starting deployment process..."

# Copy files to dist
echo "Copying files..."
cp ./src/*.html ./dist/
cp ./src/*.css ./dist/

# Bundle files
echo "Bundling files..."
npx webpack --config webpack-back.config.js 
npx webpack --config webpack-front.config.js 

# Clean up Docker resources
echo "Cleaning up Docker resources..."
docker ps  # See what's running
docker-compose down || true  # Continue even if this fails
sleep 5  # Give system time to clean up

echo "Pruning Docker resources..."
docker container prune -f
docker volume prune -f
docker image prune -f

# Build new containers
echo "Building containers..."
docker-compose build --no-cache  # Force a fresh build
sleep 5  # Give system time to process

echo "Starting containers..."
docker-compose up
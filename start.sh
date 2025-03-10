#!/bin/bash
set -x  # Enable command echoing for debugging

#Erase the dist directory if it does exist
rm -rf dist
# Create dist directory
mkdir -p dist

# Copy HTML and CSS files from src to dist
cp ./src/*.html ./dist/
cp ./src/*.css ./dist/
# Copy the assets and content to dist
cp -r ./src/assets ./dist/assets

# Build the backend and frontend using webpack
npx webpack --config webpack-back.config.js --mode production 
npx webpack --config webpack-front.config.js --mode production 

# Show running containers
docker ps
# Stop any running containers from previous runs (|| true prevents script from failing if nothing to stop)
docker-compose down || true

# Clean up docker resources
docker container prune -f  # Remove all stopped containers
docker volume prune -f     # Remove all unused volumes
docker image prune -f      # Remove all dangling images

# Build fresh containers without using cache
docker-compose build --no-cache

# Start the application
docker-compose up
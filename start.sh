#!/bin/bash
set -x  # Enable command echoing for debugging
#lol
#Erase the dist directory if it does exist
rm -rf dist
# Create dist directory
mkdir -p dist
mkdir -p dist/FrontEnd

# Copy HTML and CSS files from src to dist
cp ./src/FrontEnd/*.html ./dist/FrontEnd/
cp ./src/FrontEnd/*.css ./dist/FrontEnd/
# Copy the assets and content to dist
cp -r ./src/FrontEnd/assets ./dist/FrontEnd/assets


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

# Build fresh containers using cache
docker-compose build 

# Start the application
docker-compose up
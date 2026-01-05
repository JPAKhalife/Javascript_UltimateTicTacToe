#!/bin/bash

# Default log level is DEBUG if not specified
LOG_LEVEL=${1:-DEBUG}

echo "Starting webpack dev server with LOG_LEVEL=$LOG_LEVEL"
npx webpack serve --config webpack-front.config.js --mode development --env LOG_LEVEL=$LOG_LEVEL
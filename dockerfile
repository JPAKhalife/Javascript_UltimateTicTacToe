# Use an official Node.js runtime as the base image
FROM node:23-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install only production dependencies using the lockfile for reproducibility
RUN npm ci --omit=dev

# Copy the rest of the application code to the working directory recursively
COPY ./dist/ /app/

# Copy the environment file from the backend source
COPY ./src/BackEnd/.env /app/.env

# Expose the port on which the server will run
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
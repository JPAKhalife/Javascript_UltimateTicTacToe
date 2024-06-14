# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install
# Check dependencies for vulnerabilities and fix them (I think this is pointless)
RUN npm audit fix

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port on which the server will run
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
# Use Node.js base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (if any)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all remaining source code
COPY . .

# Expose your app port (example: 3000)
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]

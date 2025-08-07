FROM node:20

# Set working directory inside the container
WORKDIR /app

# Copy only package files first for caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy the rest of the app code
COPY . .

# Expose the app port (change if needed)
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]

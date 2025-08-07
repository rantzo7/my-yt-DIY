# Use Node.js base image
FROM node:20

# Install ffmpeg and python3-pip (for yt-dlp)
RUN apt-get update && \
    apt-get install -y ffmpeg python3-pip && \
    pip install --upgrade yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of your project
COPY . .

# Expose the port your app uses
EXPOSE 3000

# Start your app
CMD ["node", "index.js"]


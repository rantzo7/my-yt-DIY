FROM node:20

# Install ffmpeg and yt-dlp (standalone binary)
RUN apt-get update && \
    apt-get install -y curl ffmpeg && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Set app directory
WORKDIR /app

# Install node dependencies
COPY package*.json ./
RUN npm install

# Copy all app files
COPY . .

# Expose default app port
EXPOSE 3000

# Start the app
CMD ["node", "index.js"]

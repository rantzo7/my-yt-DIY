FROM node:20

# Install dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        ffmpeg \
        python3 \
        python3-pip \
        ca-certificates \
        curl && \
    pip install --upgrade yt-dlp && \
    rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Expose app port
EXPOSE 3000

# Start app
CMD ["node", "index.js"]

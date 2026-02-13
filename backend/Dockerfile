FROM node:20-bullseye-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 python3-pip \
        build-essential pkg-config \
        libffi-dev libssl-dev \
        libmupdf-dev \
        libjpeg-dev zlib1g-dev libpng-dev libwebp-dev libtiff-dev libopenjp2-7-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm ci --only=production

# Copy Python dependency list and install
COPY requirements.txt ./
RUN python3 -m pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port for Express backend
EXPOSE 5001

# Start server
CMD ["node", "src/server.js"]

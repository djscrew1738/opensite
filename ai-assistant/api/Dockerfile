FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source
COPY src/ ./src/

# Create uploads directory
RUN mkdir -p /app/uploads

EXPOSE 3210

CMD ["npm", "start"]

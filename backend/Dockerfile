FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies for development)
# Rebuild native modules to ensure compatibility
RUN npm install && npm rebuild bcrypt --build-from-source

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start application (will use start:dev in docker-compose)
CMD ["npm", "run", "start:dev"]

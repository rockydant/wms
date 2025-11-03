FROM node:20-alpine

WORKDIR /app

# Install grunt-cli globally
RUN npm install -g grunt-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 4200

# Start development server
CMD ["npm", "start"]

# Use minimal node image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ONLY production deps
RUN npm install --omit=dev

# Copy code
COPY . .

# Use non-root user (SECURITY 🔥)
RUN addgroup -S app && adduser -S app -G app
USER app

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "src/server.js"]
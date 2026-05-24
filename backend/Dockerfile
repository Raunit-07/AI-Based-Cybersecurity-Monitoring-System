# Stage 1: Build dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install only production dependencies using npm ci (clean install)
RUN npm ci --omit=dev

# Stage 2: Final lightweight runtime
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy production node_modules from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy application files with appropriate ownership
COPY --chown=node:node . .

# Set default env variables (can be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=5000

# Use non-root node user
USER node

EXPOSE 5000

# Health check using runtime PORT environment variable
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/health || exit 1

CMD ["node", "src/server.js"]
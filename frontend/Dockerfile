# ==========================
# Stage 1: Build stage
# ==========================
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

# Clean reproducible install
RUN npm ci

COPY . .

# Build-time environment variable
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Create production build
RUN npm run build


# ==========================
# Stage 2: Production Nginx
# ==========================
FROM nginx:alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Remove default nginx config/files
RUN rm -rf /usr/share/nginx/html/* \
    && rm -f /etc/nginx/conf.d/default.conf

# Copy frontend build output
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Production health check:
# Uses GET request instead of HEAD
# Prevents false unhealthy state
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
CMD wget -qO- http://localhost/ >/dev/null || exit 1

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
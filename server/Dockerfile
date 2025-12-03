# Multi-stage Dockerfile for production Node.js app (server)
# Stage 1 - install deps
FROM node:18-alpine AS deps
WORKDIR /app

# Install build deps
RUN apk add --no-cache python3 make g++

# Copy package manifests
COPY package.json package-lock.json* ./

# Install only production dependencies (we'll install dev deps in the build stage if needed)
RUN npm ci --only=production

# Stage 2 - build (if you have build steps; otherwise we copy sources)
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy app source
COPY . .

# Use environment variable to allow ECS to set port at runtime
ENV NODE_ENV=production
ENV PORT=5050

# Ensure logs directory exists
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the port the app listens on
EXPOSE 5050

# Healthcheck (optional) - checks the root or /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:5050/ || exit 1

# Start the server
CMD ["node", "index.js"]

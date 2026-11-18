# syntax=docker/dockerfile:1.7
# Multi-stage Dockerfile for Next.js Frontend (optimized standalone build)

# Stage 1: Dependencies and Build
FROM node:20-alpine AS builder

WORKDIR /app

# Accept API base URL during build (baked into the client bundle)
ARG NEXT_PUBLIC_API_URL=http://localhost:15433
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1

# Copy dependency manifests first to maximize layer caching
COPY package.json package-lock.json ./

# Reproducible install with a persistent npm download cache (BuildKit cache mount)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-maxtimeout=120000

COPY . .

# Build production standalone bundle
RUN npm run build

# Stage 2: Production Runner (lightweight, no npm install)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy public static files
COPY --from=builder /app/public ./public

# Copy standalone server output and static assets with non-root ownership
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]

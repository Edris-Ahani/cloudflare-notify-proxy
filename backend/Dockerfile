# Multi-stage Dockerfile for NestJS Backend with automated Prisma migrations
# Using Debian slim for robust OpenSSL and native binary (Argon2 / Prisma) compatibility

# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install openssl required by Prisma engines
RUN apt-get update -y && apt-get install -y openssl

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production Runner
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install runtime OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package manifests and node_modules from builder
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

# Automatically run pending migrations before starting the NestJS application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

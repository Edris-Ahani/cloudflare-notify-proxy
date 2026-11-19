# syntax=docker/dockerfile:1.7
# Multi-stage Dockerfile for NestJS Backend with automated Prisma migrations.
# Debian slim is used for robust OpenSSL and native binary (Argon2 / Prisma) compatibility.

# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install openssl required by Prisma engines
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests first to maximize layer caching
COPY package.json package-lock.json ./

# Reproducible install with a persistent npm download cache (BuildKit cache mount)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-maxtimeout=120000

# Copy Prisma schema and generate the client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code and compile
COPY . .
RUN npm run build

# Strip devDependencies so the runtime image only ships production modules,
# then regenerate the Prisma client into the pruned tree.
RUN npm prune --omit=dev --no-audit --no-fund && npx prisma generate

# Stage 2: Production Runner
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install runtime OpenSSL and networking diagnostics tools (curl, nc)
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl curl netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Copy only production artifacts from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

# Apply pending migrations with automatic retry before starting the NestJS application
CMD ["sh", "-c", "until npx prisma migrate deploy; do echo 'Waiting for database to be reachable...'; sleep 2; done && node dist/main.js"]

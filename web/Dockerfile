# Multi-stage Dockerfile for Next.js Frontend

# Stage 1: Dependencies and Build
FROM node:20-alpine AS builder

WORKDIR /app

# Accept API base URL during build
ARG NEXT_PUBLIC_API_URL=http://localhost:15433
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./

RUN npm install

COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./

RUN npm install --omit=dev

# Copy build artifacts and public assets
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "run", "start"]

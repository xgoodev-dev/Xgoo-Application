# ============================================================
# XGoo Courier SaaS - Production Dockerfile
# Multi-stage build: deps → builder → runner
# ============================================================

# ---- Stage 1: Install ALL dependencies (including dev) ----
FROM node:22-alpine AS deps
WORKDIR /app

# Install native build tools required for compiling any optional packages
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

# ---- Stage 2: Build (Vite client + esbuild server bundle) ----
FROM node:22-alpine AS builder
WORKDIR /app

# Copy all installed deps (including devDeps needed for build tools: tsx, vite, esbuild)
COPY --from=deps /app/node_modules ./node_modules

# Copy full source
COPY . .

# Vite bakes these into the client bundle at build time — pass as Docker build args
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_DEFAULT_OFFICE_SLUG
ARG VITE_SITE_URL
ARG VITE_META_PIXEL_ID
ARG VITE_WHATSAPP_NUMBER

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_DEFAULT_OFFICE_SLUG=$VITE_DEFAULT_OFFICE_SLUG \
    VITE_SITE_URL=$VITE_SITE_URL \
    VITE_META_PIXEL_ID=$VITE_META_PIXEL_ID \
    VITE_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER

# Build: Vite compiles client → dist/public, esbuild bundles server → dist/index.cjs
RUN npm run build

# ---- Stage 3: Production runner (lean image) ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3005

# Install only production deps (skip devDeps and optional native modules)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --omit=optional && npm cache clean --force

# Copy the compiled application from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory and set permissions for node non-root user
RUN mkdir -p /app/uploads && chown -R node:node /app

# Run as non-root user for security
USER node

# Expose the application port (default 3005)
EXPOSE 3005

# Health check endpoint verification
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3005/ || exit 1

CMD ["node", "dist/index.cjs"]

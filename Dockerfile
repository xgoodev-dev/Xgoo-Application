# ============================================================
# XGoo Courier SaaS - Production Dockerfile
# Multi-stage build: deps → build → runner
# ============================================================

# ---- Stage 1: Install ALL dependencies (including dev) ----
FROM node:22-alpine AS deps
WORKDIR /app

# Install native build tools required for compiling optional packages
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

# Vite bakes these into the client bundle at build time — must be passed as build args
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build: Vite compiles client → dist/public, esbuild bundles server → dist/index.cjs
RUN npm run build

# ---- Stage 3: Production runner (lean image) ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install only production deps (skip devDeps and optional native modules)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --omit=optional && npm cache clean --force

# Copy the compiled application from builder
COPY --from=builder /app/dist ./dist

# Create upload directory — mount a Docker volume here for persistence
RUN mkdir -p /app/uploads

# Expose the application port (configure via PORT env var, defaults to 3000)
EXPOSE 3000

CMD ["node", "dist/index.cjs"]

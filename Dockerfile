# Dockerfile for Next.js application on Google Cloud Run

# Use the official Node.js runtime as the base image (optimized for production)
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
# Copy prisma schema for postinstall hook
COPY prisma ./prisma
RUN npm ci

# Production dependencies
FROM base AS prod-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
# Copy prisma schema for postinstall hook
COPY prisma ./prisma
RUN npm ci --omit=dev

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments - using placeholder values for security
# Real values will be set at runtime through Cloud Run environment variables
ARG NEXTAUTH_URL="http://placeholder:3000"
ARG NEXTAUTH_SECRET="placeholder-secret-for-build-only"
ARG GOOGLE_CLIENT_ID="placeholder"
ARG GOOGLE_CLIENT_SECRET="placeholder"
ARG DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ARG SUPABASE_URL="http://placeholder"
ARG SUPABASE_ANON_KEY="placeholder"
ARG ADMIN_SECURITY_TOKEN="placeholder"
ARG SUPABASE_SERVICE_ROLE_KEY="placeholder"

# Set environment variables for build (these are just for build, not runtime)
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV DATABASE_URL=$DATABASE_URL
ENV SUPABASE_URL=$SUPABASE_URL
ENV SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
ENV ADMIN_SECURITY_TOKEN=$ADMIN_SECURITY_TOKEN
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next (optimized)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

ENV PORT 8080
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]

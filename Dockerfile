# Stage 1: Build client
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build

# Stage 3: Production image
FROM node:20-alpine
RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Copy server production files
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=server-build /app/server/dist ./dist
COPY server/cards ./cards
COPY server/fonts ./fonts

# Create writable directories
RUN mkdir -p edited layers && chown -R app:app /app

# Copy client build to serve statically (optional - can also use a CDN/nginx)
COPY --from=client-build /app/client/dist ./public

USER app

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "dist/index.js"]

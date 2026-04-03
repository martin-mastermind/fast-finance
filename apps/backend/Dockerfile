FROM oven/bun:1.3
WORKDIR /app

# Install dependencies (cached layer)
COPY package.json bun.lock* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN bun install

# Copy source and build
COPY . .
WORKDIR /app/apps/backend
RUN bun build src/index.ts --target bun --outdir dist

EXPOSE 3001
CMD ["bun", "run", "dist/index.js"]

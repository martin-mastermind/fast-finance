FROM oven/bun:1.3-alpine
WORKDIR /app

# Install dependencies (cached layer — only re-runs when lockfile changes)
COPY package.json bun.lock* ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
RUN bun install --frozen-lockfile

# Copy full monorepo source
COPY . .

EXPOSE 3001

# Bun runs TypeScript natively — no build step needed,
# and workspace package resolution works correctly at runtime.
CMD ["bun", "run", "apps/backend/src/index.ts"]

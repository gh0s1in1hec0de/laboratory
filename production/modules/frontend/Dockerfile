# Deps
FROM oven/bun:latest AS deps

WORKDIR /app

COPY bun.lockb ./
COPY package.json ./
# COPY bunfig.toml ./

RUN bun install

# Build
FROM oven/bun:latest AS builder

WORKDIR /app

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN bun run build

# Run
FROM oven/bun:latest AS runner

WORKDIR /app

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# COPY --from=builder /app/bunfig.toml ./bunfig.toml

EXPOSE 3000

CMD ["bun", "run", "start"]
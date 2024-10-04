# Stage 1: Dependencies
FROM oven/bun:latest AS deps

WORKDIR /app

# Copy the entire project directory
COPY . .

# Install dependencies (including workspace packages)
RUN bun install

# Stage 2: Build the Next.js app
FROM oven/bun:latest AS builder

WORKDIR /app

# Use the dependencies from the first stage
COPY --from=deps /app/node_modules ./node_modules

# Build the frontend
WORKDIR /app/modules/frontend
CMD ["bun", "run", "build", "--cwd", "modules/frontend"]

# Stage 3: Final runner stage
FROM oven/bun:latest AS runner

WORKDIR /app

# Copy the necessary build artifacts from the builder stage
COPY --from=builder /app/modules/frontend/.next ./.next
COPY --from=builder /app/modules/frontend/public ./public
COPY --from=builder /app/modules/frontend/next.config.js ./next.config.js
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/modules/frontend/package.json ./package.json

# Expose the Next.js port
EXPOSE 3000

# Command to start the Next.js app in production mode
CMD ["bun", "run", "start", "--cwd", "modules/frontend"]



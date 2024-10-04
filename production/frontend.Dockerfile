# Use the Bun base image
FROM oven/bun:latest

# Set the working directory
WORKDIR /app

# Copy the entire project to the container
COPY . .

# Install the dependencies for the entire workspace
RUN bun install

# Move to the frontend directory and run the build
WORKDIR /app/modules/frontend
RUN bun run build

# Expose the Next.js app port
EXPOSE 3000

# Start the Next.js app
CMD ["bun", "run", "start", "--cwd", "modules/frontend"]




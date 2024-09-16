FROM oven/bun:latest
RUN apt-get update && apt-get install -y postgresql-client

# Create the main directory and set working directory
WORKDIR /app

# Copy the periphery package at the same level as the oracle directory
COPY . /app
RUN rm -f .env && mv .env.docker .env

RUN bun install
EXPOSE 3000

CMD bun run oracle
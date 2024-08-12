# TODO Unoffical docker repo, check it
FROM oven/bun:latest AS build

WORKDIR /app

COPY bun.lockb .
COPY package.json .
COPY tsconfig.json .
COPY src ./src

RUN bun install

FROM postgres:latest AS db
ENV POSTGRES_DB=launchpad
ENV POSTGRES_USER=dev
ENV POSTGRES_PASSWORD=dev_pass

# Expose the PostgreSQL port
EXPOSE 5432

# Create a script to initialize the database and run the app
COPY --from=build /app /app
WORKDIR /app

# Wait for the database to start and then run the application
CMD ["sh", "-c", "until pg_isready -h localhost -p 5432; do echo waiting for database; sleep 2; done; bun run src/index.ts --flag1 --flag2"]

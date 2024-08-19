import { userRoutes } from "./routes";
import { getConfig } from "./config";
import { greeting } from "./utils";
import dotenv from "dotenv";
import Elysia from "elysia";
import * as db from "./db";

dotenv.config();
greeting();

const config = getConfig();

// Disable console.debug unless debug logging is explicitly enabled
if (!config.debug_mode) console.debug = () => {};

console.debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

if (config.db.should_migrate) {
    console.log("applying migrations to clean database...");
    console.log();
    await db.applyMigrations();
}
if (config.oracle.core_height) {
    await db.setCoreHeight(config.oracle.core_height!);
}

async function main() {
    // We parse current launches we have to manage with our promise-workers
    // const storedActiveLaunches = await db.getActiveTokenLaunches();
    console.log(process.title);
    const app = new Elysia()
        .group("/api", (app) => app.use(userRoutes))
        .listen(config.server.port);

    console.log(`server is running at ${app.server?.hostname}:${app.server?.port}`);
}

main().then();

// command to download modules for production
// bun install --frozen-lockfile
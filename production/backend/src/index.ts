import {userRoutes} from "./routes";
import {getConfig} from "./config";
import {greeting} from "./utils";
import * as db from "./db";
import dotenv from "dotenv";
import Elysia from "elysia";

dotenv.config();
greeting();

// Disable console.debug unless debug logging is explicitly enabled
if (getConfig().debug_mode) console.debug = () => {};
console.debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

if (getConfig().db.should_migrate) {
    console.log(`applying migrations to clean database...`);
    console.log();
    await db.applyMigrations();
}
if (getConfig().oracle.core_height) {
    await db.setCoreHeight(getConfig().oracle.core_height!);
}

async function main() {
    // We parse current launches we have to manage with our promise-workers
    // const storedActiveLaunches = await db.getActiveTokenLaunches();

    const app = new Elysia()
      .group("/api", (app) => app.use(userRoutes))
      .listen(process.env.SERVER_PORT);

    console.log(`🚀 Server is running at ${app.server?.hostname}:${app.server?.port}`)
}

main().then();

// command to download modules for production
// bun install --frozen-lockfile
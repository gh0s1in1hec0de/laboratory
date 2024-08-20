import { handleCoreUpdates } from "./oracle";
import { userRoutes } from "./server";
import { getConfig } from "./config";
import { greeting } from "./utils";
import { Address } from "@ton/ton";
import dotenv from "dotenv";
import Elysia from "elysia";
import * as db from "./db";

dotenv.config();
greeting();

const config = getConfig();

// Disable console.debug unless debug logging is explicitly enabled
if (!config.debug_mode) console.debug = () => {
};

console.debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

if (config.db.should_migrate) {
    console.log("applying migrations to clean database...");
    console.log();
    await db.applyMigrations();
}
const { address, height, force_height } = config.oracle.core;
if (height) await db.setCoreHeight(address, height, force_height);

async function main() {
    // We parse current launches we have to manage with our promise-workers
    // const storedActiveLaunches = await db.getActiveTokenLaunches();
    const app = new Elysia()
        .group("/api", (app) => app.use(userRoutes))
        .listen(config.server.port);
    console.log(`server is running at ${app.server?.hostname}:${app.server?.port}`);

    if (Address.parse(address)) handleCoreUpdates(address);
}

main().then();

// command to download modules for production
// bun install --frozen-lockfile
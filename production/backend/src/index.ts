import {getConfig} from "./config.ts";
import {greeting} from "./utils.ts";
import dotenv from "dotenv";
import * as db from "./db";

dotenv.config();
greeting();

// Disable console.debug unless debug logging is explicitly enabled
if (getConfig().debug_mode) console.debug = () => {};
console.debug(`db config: ${process.env.DB_HOST} | ${process.env.DB_NAME} | ${process.env.DB_USER} | ${process.env.DB_PASSWORD}`);

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
    const storedActiveLaunches = await db.getActiveTokenLaunches();

}

main().then();

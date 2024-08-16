import {greeting, parseArgsConfig} from "./utils.ts";
import {parseArgs} from "util";
import dotenv from "dotenv";
import * as db from "./db";

dotenv.config();
greeting();
const {values, positionals} = parseArgs(parseArgsConfig(Bun.argv));

// Disable console.debug unless debug logging is explicitly enabled
if (!values.debug) console.debug = () => {};
console.debug(`db config: ${process.env.DB_HOST} | ${process.env.DB_NAME} | ${process.env.DB_USER} | ${process.env.DB_PASSWORD}`);

if (values.fresh) {
    console.log(`applying migrations to clean database...`);
    console.log();
    await db.applyMigrations();
}
if (values.height) {
    const parsedUnix = parseInt(values.height as string, 10);
    const forcedHeight = new Date(parsedUnix)
    await db.setCoreHeight(forcedHeight);
}

async function main() {

    // We parse current launches we have to manage with our promise-workers
    const storedActiveLaunches = await db.getActiveTokenLaunches();

}

main().then();

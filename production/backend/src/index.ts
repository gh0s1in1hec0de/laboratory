import {greeting} from "./utils.ts";
import dotenv from "dotenv";
import * as db from "./db";

dotenv.config();

if (!Bun.argv.includes("--production")) greeting();

// Disable console.debug unless debug logging is explicitly enabled
if (!Bun.argv.includes("--debug")) console.debug = () => {};

const sql = await db.createPostgresClient();

export const CLEAN_START = Bun.argv.includes("--fresh");
if (CLEAN_START) {
    console.log(`applying migrations to clean database...`);
    console.log();
    await db.applyMigrations(sql);
}

async function main() {

}

import {greeting} from "./utils.ts";
import dotenv from "dotenv";
import * as db from "./db";

dotenv.config();
greeting();

// Disable console.debug unless debug logging is explicitly enabled
if (!Bun.argv.includes("--debug")) console.debug = () => {};

console.debug(`db ${process.env.DB_HOST} | ${process.env.DB_HOST} | ${process.env.DB_NAME} | ${process.env.DB_USER} | ${process.env.DB_PASSWORD}`);

export const CLEAN_START = Bun.argv.includes("--fresh");
if (CLEAN_START) {
    console.log(`applying migrations to clean database...`);
    console.log();
    await db.applyMigrations();
}

async function main() {

}

import { handleCoreUpdates, spawnNewLaunchesScanners, chiefScanning } from "./oracle";
import { getConfig } from "./config";
import { getServer } from "./server";
import { Address } from "@ton/ton";
import { greeting } from "./utils";
import { logger } from "./logger";
import { getBot } from "./bot";
import dotenv from "dotenv";
import * as db from "./db";

dotenv.config();
greeting();
const config = getConfig();

logger().debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);
if (config.db.should_migrate) {
    logger().info("applying migrations to clean database...");
    await db.applyMigrations();
}

async function main() {
    getServer();
    await getBot();

    // Separated logic for  core and launches indexing for better flexibility
    for (const { address, height, force_height, version } of config.oracle.cores) {
        const formatted = Address.parse(address).toRawString();
        if (height) await db.setHeightForAddress(formatted, height, force_height);
        handleCoreUpdates(formatted, version);
    }
    spawnNewLaunchesScanners();
    chiefScanning();
}

main().then();
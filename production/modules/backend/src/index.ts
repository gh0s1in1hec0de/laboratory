import { getServer, sendMessageToWsClient } from "./server";
import { delay, greeting } from "./utils";
import { getConfig } from "./config";
import { logger } from "./logger";
import dotenv from "dotenv";
import * as db from "./db";

dotenv.config();
greeting();

const config = getConfig();

logger().info(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

if (config.db.should_migrate) {
    logger().info("applying migrations to clean database...");
    await db.applyMigrations();
}
const { address, height, force_height } = config.oracle.core;
// if (height) await db.setCoreHeight(address, height, force_height);

async function main() {
    // We parse current launches we have to manage with our promise-workers
    // const storedActiveLaunches = await db.getActiveTokenLaunches();
  
    const server = getServer();
  
    // Test
    for (let i = 0; i < 10; i++) {
        sendMessageToWsClient("exampleTokenAddress", ["meow"]);
        await delay(5000);
    }
  
    // if (Address.parse(address)) handleCoreUpdates(address);
}

main().then();

/** TODO Here are some useful commands/features for development (delete in prod)
 * command to download modules for production: bun install --frozen-lockfile
 */
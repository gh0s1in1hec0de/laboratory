import { startServer } from "./server";
import { getConfig } from "./config";
import { logger } from "./logger";
import { startBot } from "./bot";
import dotenv from "dotenv";

dotenv.config();

logger().debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

async function main() {
    logger().info(`mode: ${getConfig().mode}`);

    startServer();
    await startBot();
}

main().then();
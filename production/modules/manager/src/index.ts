import { logger } from "./logger";
import { getBot } from "./bot";
import dotenv from "dotenv";
import { getConfig } from "./config.ts";
import { getServer } from "./server";

dotenv.config();

logger().debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

async function main() {
    console.info(`mode: ${getConfig().mode}`);

    getServer();
    await getBot();
}

main().then();
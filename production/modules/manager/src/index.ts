import { logger } from "./logger";
import { getBot } from "./bot";
import dotenv from "dotenv";
import { getConfig } from "./config.ts";

dotenv.config();

logger().debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

async function main() {
    console.info(`mode: ${getConfig().mode}`);

    await getBot();
}

main().then();
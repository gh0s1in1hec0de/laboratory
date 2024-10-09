import { logger } from "./logger";
import dotenv from "dotenv";
import { getConfig } from "./config.ts";
import { startServer } from "./server";

dotenv.config();

logger().debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

async function main() {
    console.info(`mode: ${getConfig().mode}`);

    startServer();
}

main().then();
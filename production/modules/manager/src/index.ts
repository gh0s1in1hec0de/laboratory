import { logger } from "./logger";
import { getBot } from "./bot";
import dotenv from "dotenv";

dotenv.config();

logger().debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

async function main() {
    await getBot();
}

main().then();
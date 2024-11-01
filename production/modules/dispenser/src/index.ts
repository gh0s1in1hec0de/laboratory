import { scanForRequests } from "./oracle";
import { startServer } from "./server";
import { getConfig } from "./config";
import { logger } from "./logger";
import dotenv from "dotenv";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error Prototype modification works at runtime, typescript doesn't like it
BigInt.prototype.toJSON = function () {
    return this.toString();
};

dotenv.config();
logger().debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

async function main() {
    console.info(`mode: ${getConfig().mode}`);

    startServer();
    // scanForRequests().then();
}

main().then();
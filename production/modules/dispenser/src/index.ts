import { EventEmitter } from "node:events";
import { scanForRequests } from "./oracle";
import { startServer } from "./server";
import { getConfig } from "./config";
import { Address } from "@ton/ton";
import { logger } from "./logger";
import dotenv from "dotenv";
import * as db from "./db";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error Prototype modification works at runtime, typescript doesn't like it
BigInt.prototype.toJSON = function () {
    return this.toString();
};
EventEmitter.defaultMaxListeners = 1000;

dotenv.config();
logger().debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

const { ton } = getConfig();

async function main() {
    logger().info(`running in: ${getConfig().mode}`);

    startServer();
    const { address, maybe_height } = ton.wallet;
    if (maybe_height) {
        const formatted = Address.parse(address).toRawString();
        await db.setHeightForAddress(formatted, maybe_height, true);
    }
    scanForRequests().then();
}

main().then();
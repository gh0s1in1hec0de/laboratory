import { handleCoreUpdates, spawnNewLaunchesScanners, chiefScanning } from "./oracle";
import { EventEmitter } from "node:events";
import { startServer } from "./server";
import { getConfig } from "./config";
import { Address } from "@ton/ton";
import { greeting } from "./utils";
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
greeting();
const { oracle } = getConfig();

logger().debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

async function main() {
    logger().info(`running in: ${getConfig().mode}`);
    startServer();

    // Separated logic for  core and launches indexing for better flexibility
    if (oracle.chief.maybe_height) {
        await db.setHeightForAddress(Address.parse(oracle.chief.address).toRawString(), oracle.chief.maybe_height, true);
    }
    for (const { address, maybe_height, version } of oracle.cores) {
        const formatted = Address.parse(address).toRawString();
        if (maybe_height) await db.setHeightForAddress(formatted, maybe_height, true);
        handleCoreUpdates(formatted, version).then();
    }
    spawnNewLaunchesScanners().then();
    chiefScanning().then();
}

main().then();
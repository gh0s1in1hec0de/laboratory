import { handleCoreUpdates, spawnNewLaunchesScanners, chiefScanning } from "./oracle";
import { getConfig } from "./config";
import { startServer } from "./server";
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

dotenv.config();
greeting();
const { oracle } = getConfig();

logger().debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

async function main() {
    startServer();

    // Separated logic for  core and launches indexing for better flexibility
    // for (const { address, height, force_height, version } of oracle.cores) {
    //     const formatted = Address.parse(address).toRawString();
    //     if (height) await db.setHeightForAddress(formatted, height, force_height);
    //     handleCoreUpdates(formatted, version).then();
    // }
    // spawnNewLaunchesScanners().then();
    // chiefScanning().then();
}

main().then();
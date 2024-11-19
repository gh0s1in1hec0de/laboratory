import { startServer } from "./server";
import { getConfig } from "./config";
import { logger } from "./logger";
import { startBot } from "./bot";
import dotenv from "dotenv";

/* Plans on manager:
 * Manual setting of reward pool to launch (it could change already existing reward/add non-existing)
 * Safe withdraw of jettons/tons from dispenser/oracle
*/

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error Prototype modification works at runtime, typescript doesn't like it
BigInt.prototype.toJSON = function () {
    return this.toString();
};

dotenv.config();

logger().debug(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

async function main() {
    logger().info(`running in: ${getConfig().mode}`);
    startServer();
    await startBot();
}

main().then();
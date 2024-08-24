import { getSwaggerDocsConfig, userRoutes } from "./server";
import { swagger } from "@elysiajs/swagger";
import { getUserByAddress } from "./db";
import { getConfig } from "./config";
import { useLogger } from "./logger";
import { greeting } from "./utils";
import Elysia, { t } from "elysia";
import dotenv from "dotenv";
import * as db from "./db";

dotenv.config();
greeting();

const config = getConfig();
const logger = useLogger();

logger.info(`db config: ${process.env.POSTGRES_DB} | ${process.env.POSTGRES_USER} | ${process.env.POSTGRES_PASSWORD}`);

if (config.db.should_migrate) {
    logger.info("applying migrations to clean database...");
    // await db.applyMigrations();
}
const { address, height, force_height } = config.oracle.core;
// if (height) await db.setCoreHeight(address, height, force_height);

const users = new Map<string, any>();

export function sendMessageToWsClient(address: string, message: string) {
    const client = users.get(address);
    if (client && client.readyState === client.OPEN) {
        client.send(message);
    }
}

async function main() {
    // We parse current launches we have to manage with our promise-workers
    // const storedActiveLaunches = await db.getActiveTokenLaunches();

    const app = new Elysia({ prefix: "/api" })
        .use(swagger({
            documentation: getSwaggerDocsConfig({
                title: config.server.swagger.title,
                version: config.server.swagger.version
            })
        }))
        .ws("/ws", {
            idleTimeout: 120,  // if connection has not received a message for this many seconds, it will be closed
            query: t.Object({
                address: t.String()
            }),
            open(ws) {
                const { address } = ws.data.query;
                const user = db.getUserByAddress(address);

                if (!user){
                    logger.warn(`Client with ${address} not found!`);
                    return;
                }

                users.set(address, ws);
                logger.info(`Client connected: ${address}`);
            },
            message(ws, message) {
                // ...
            },
            close(ws) {
                const { address } = ws.data.query;

                users.delete(address);
                logger.info(`Client disconnected: ${address}`);
            },
        })
        .use(userRoutes)
        .onError((err) => {
            logger.error(err);
        })
        .listen(config.server.port);

    logger.info(`elysia server is running at ${app.server?.hostname}:${app.server?.port}`);
    logger.info(`swagger docs are available at http://${app.server?.hostname}:${app.server?.port}/api/swagger`);

    // if (Address.parse(address)) handleCoreUpdates(address);
}

main().then();

/** TODO Here are some useful commands/features for development (delete in prod)
 * command to download modules for production: bun install --frozen-lockfile
 * link to swagger: http:/localhost:3000/swagger
 */
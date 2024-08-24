import type { SqlClient } from "./types";
import { logger } from "../logger";
import postgres from "postgres";
import * as path from "path";
import * as fs from "fs";

let cachedGlobalClient: SqlClient | null = null;
export async function createPostgresClient(): Promise<SqlClient> {
    if (!cachedGlobalClient) {
        cachedGlobalClient = postgres({
            host: "db",
            port: 5432,
            database: process.env.POSTGRES_DB,
            username: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            types: { bigint: postgres.BigInt },
            transform: postgres.camel
        });
        await cachedGlobalClient.listen("user_balance_error", async (payload) => {
            const { id, action, details } = JSON.parse(payload);
            logger().error(`new user balance error#${id}: action#${action} - ${details}`);
        });
    }
    return cachedGlobalClient;
}
export const globalClient = await createPostgresClient();

export async function applyMigrations() {
    const directoryPath = path.join(__dirname, "migrations");
    const files = fs.readdirSync(directoryPath).sort();
    logger().info(globalClient);
    try {
        // Open a transaction
        await globalClient.begin(async sql => {
            for (const file of files) {
                try {
                    const migration = fs.readFileSync(path.join(directoryPath, file), "utf-8");
                    // Here we call text we got from migration .sql file as a query
                    await sql.unsafe(migration);
                } catch (_e) {
                    logger().info(`seems like migration ${file} had already been applied`);
                }
            }
        });
    } catch (e) { /* Just preventing exiting in case of already applied migrations */
    }
}
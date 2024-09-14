import type { SqlClient } from "./types";
import { logger } from "../logger";
import postgres from "postgres";
import * as path from "path";
import * as fs from "fs";

/*
  TODO Verify if it is needed to do JSON.stringify() in queries?
*/

let cachedGlobalClient: SqlClient | null = null;
export const globalClient = await createPostgresClient();

export async function createPostgresClient(): Promise<SqlClient> {
    if (!cachedGlobalClient) {
        cachedGlobalClient = postgres({
            host: process.env.POSTGRES_HOST,
            port: 5432,
            database: process.env.POSTGRES_DB,
            username: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            types: { bigint: postgres.BigInt },
            transform: postgres.camel,
            max: 10
        });
        await cachedGlobalClient.listen("user_balance_error", async (payload) => {
            const { id, action, details } = JSON.parse(payload);
            logger().error(`new user balance error#${id}: action#${action} - ${details}`);
        });
    }
    return cachedGlobalClient;
}
import type { SqlClient } from "./types";
import postgres from "postgres";
import * as path from "path";
import * as fs from "fs";

export async function createPostgresClient(): Promise<SqlClient> {
    const sql = postgres({
        host: "db",
        port: 5432,
        database: process.env.POSTGRES_DB,
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        types: { bigint: postgres.BigInt },
        transform: postgres.camel
    });
    await sql.listen("user_balance_error", async (payload) => {
        const { id, action, details } = JSON.parse(payload);
        console.error(`new user balance error#${id}: action#${action} - ${details}`);
    });
    return sql;
}

export const globalClient = await createPostgresClient();

export async function applyMigrations() {
    const directoryPath = path.join(__dirname, "migrations");
    const files = fs.readdirSync(directoryPath).sort();

    try {
        // Open a transaction
        await globalClient.begin(async sql => {
            for (const file of files) {
                try {
                    const migration = fs.readFileSync(path.join(directoryPath, file), "utf-8");
                    // Here we call text we got from migration .sql file as a query
                    await sql.unsafe(migration);
                } catch (_e) {
                    console.info(`seems like migration ${file} had already been applied`);
                }
            }
        });
    } catch (e) { /* Just preventing exiting in case of already applied migrations */ }
}
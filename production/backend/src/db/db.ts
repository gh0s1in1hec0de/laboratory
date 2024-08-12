import postgres from "postgres";
import type {Client} from "./types.ts";
import * as path from "path";
import * as fs from "fs";

export async function createPostgresClient(): Promise<Client> {
    return postgres({
        host: process.env.DB_HOST,
        port: 5432,
        database: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        types: {bigint: postgres.BigInt},
        transform: postgres.camel
    });
}

export async function applyMigrations(sql: Client) {
    const directoryPath = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(directoryPath).sort();

    // Open a transaction
    await sql.begin(async sql => {
        for (const file of files) {
            const migration = fs.readFileSync(path.join(directoryPath, file), 'utf-8');
            // Here we call text we got from migration .sql file as a query
            await sql.unsafe(migration);
        }
    })
}
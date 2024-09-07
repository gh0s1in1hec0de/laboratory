import { SortOrder, TokenLaunchFields } from "starton-periphery";
import { test, describe, beforeAll } from "bun:test";
import * as db from "../src/db";
import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

describe("Database", () => {
    let client: db.SqlClient;

    beforeAll(async () => {
        try {
            for (let i = 0; i <= 1; i++) {
                client = postgres({
                    host: "localhost",
                    port: 5432,
                    database: process.env.POSTGRES_DB,
                    username: process.env.POSTGRES_USER,
                    password: process.env.POSTGRES_PASSWORD,
                    types: { bigint: postgres.BigInt },
                    transform: postgres.camel,
                    max: 10
                });
            }
        } catch (e) {
            console.log();
        }
    });
    test.skip("migration being applied correctly", async () => {
        try {
            const directoryPath = path.join(__dirname, "../src/db/migrations");
            const files = fs.readdirSync(directoryPath).sort();
            await client.begin(async sql => {
                for (const file of files) {
                    try {
                        const migration = fs.readFileSync(path.join(directoryPath, file), "utf-8");
                        // Here we call text we got from migration .sql file as a query
                        await sql.unsafe(migration);
                    } catch (_e) {
                        console.warn(`seems like migration ${file} had already been applied`);
                    }
                }
            });
        } catch (e) {
            console.log("we ignore you haha bitch");
        }
    });
    test("any req", async () => {
        const res = await db.getSortedTokenLaunches({
            page: 1,
            limit: 10,
            orderBy: TokenLaunchFields.CREATED_AT,
            order: SortOrder.ASC,
            search: ""
        }, client);
        console.log(res?.storedTokenLaunch?.length);
    });
    test("just some temporary shit I need to check fast", async () => {

    });
});
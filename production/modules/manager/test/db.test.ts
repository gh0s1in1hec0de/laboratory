import { test, describe, beforeAll, afterAll, expect, beforeEach } from "bun:test";
import { randomAddress } from "@ton/test-utils";
import * as db from "../src/db";
import postgres from "postgres";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

describe("Database", () => {
    let client: db.SqlClient;

    beforeAll(async () => {
        client = postgres({
            host: process.env.POSTGRES_HOST,
            port: 5432,
            database: process.env.POSTGRES_DB,
            username: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            types: { bigint: postgres.BigInt },
            transform: postgres.camel,
            max: 10
        });
    });
  
    afterAll(async () => {
        await client.end();
    });
  
    beforeEach(async () => {
        await client`
        TRUNCATE
            callers,
            heights,
            launch_balances,
            earnings_per_period,
            tasks,
            token_launches,
            user_actions,
            user_balance_errors,
            user_balances,
            users_tasks_relations,
            whitelist_relations
        RESTART IDENTITY CASCADE;
    `;
    });
  
    // test.skip("migration being applied correctly", async () => {
    //     const directoryPath = path.join(__dirname, "../src/db/migrations");
    //     const files = fs.readdirSync(directoryPath).sort();
    //     await client.begin(async sql => {
    //         for (const file of files) {
    //             try {
    //                 const migration = fs.readFileSync(path.join(directoryPath, file), "utf-8");
    //                 // Here we call text we got from migration .sql file as a query
    //                 await sql.unsafe(migration);
    //             } catch (_e) {
    //                 console.warn(`seems like migration ${file} had already been applied`);
    //             }
    //         }
    //     });
    // });
    
    test("Add mock data to the database", async () => {
        const randUserAddress = randomAddress().toRawString();
        
        await db.connectWallet(randUserAddress, client);

        for (let i = 1; i <= 20; i++) {
            const taskName = `Reach for the star ${i}`;
            const description = `task ${i}&description ${i}&task ${i}&description ${i}`;
            await db.storeTask(taskName, description, client);
        }

        for (let i = 1; i <= 2; i++) {
            await db.storeUserTaskRelations(randUserAddress, i.toString(), client);
        }

        await client.unsafe(`
        DO
        $$
        BEGIN
            FOR i IN 1..20 LOOP
                INSERT INTO token_launches (
                    identifier, address, creator, version, metadata, timings, total_supply, created_at, is_successful, post_deploy_enrollment_stats, dex_data
                )
                VALUES (
                    'TokenLaunch_' || i,
                    '0x' || lpad(to_hex(i), 48, '0'),
                    '0x' || lpad(to_hex(i + 100), 48, '0'),
                    'V1',
                    ('{"description": "Test metadata for launch ' || i || '"}')::jsonb,
                    '{"start_time": "2024-09-01T00:00:00", "end_time": "2024-09-30T23:59:59"}'::jsonb,
                    1000000000,
                    extract(epoch from now())::bigint,
                    NULL,  -- is_successful
                    NULL,  -- post_deploy_enrollment_stats
                    NULL   -- dex_data
                );
            END LOOP;
        END;
        $$;
        `);
    
    
        const callers = await client`SELECT *
                                 FROM callers;`;
        expect(callers.length).toBe(1);
    
        const tasks = await client`SELECT *
                               FROM tasks;`;
        expect(tasks.length).toBe(20);

        const usersTasksRelations = await client`SELECT *
                               FROM users_tasks_relations;`;
        expect(usersTasksRelations.length).toBe(2);
    
        const tokenLaunches = await client`SELECT *
                                       FROM token_launches;`;
        expect(tokenLaunches.length).toBe(20);
    });
    
    // test("any req", async () => {
    //     const res = await db.getSortedTokenLaunches({
    //         page: 1,
    //         limit: 10,
    //         orderBy: TokenLaunchFields.CREATED_AT,
    //         order: SortOrder.ASC,
    //         search: ""
    //     }, client);
    //     console.log(res?.storedTokenLaunch?.length);
    // });
    //
    // test("just some temporary shit I need to check fast", async () => {
    //
    // });
});
import * as fs from "fs";
import * as path from "path";
// @ts-ignore
import postgres from "postgres";

async function main() {
    const directoryPath = path.join(__dirname, "migrations");
    const files = fs.readdirSync(directoryPath).sort();

    const client = postgres({
        host: process.env.POSTGRES_HOST,
        port: 5432,
        database: process.env.POSTGRES_DB,
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        types: { bigint: postgres.BigInt },
        transform: postgres.camel,
        max: 10
    });

    try {
        for (const file of files) {
            const migration = fs.readFileSync(path.join(directoryPath, file), "utf-8");
            try {
                await client.unsafe(migration);
                console.info(`[*] ${file}`);
            } catch (e) {
                console.warn(`[ ] ${file}: ${e.message}`);
            }
        }
    } catch (e) {
        console.error(`Failed to apply migrations: ${e.message}`);
    } finally {
        await client.end();  // Close the client connection
    }
}

// Run the main function
main().catch(e => console.error(`Migration process failed: ${e.message}`));

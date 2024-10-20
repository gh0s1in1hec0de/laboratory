import { LaunchSortParameters, SortingOrder } from "starton-periphery";
import { beforeAll, describe, test } from "bun:test";
import { ok as assert } from "node:assert";
import * as db from "../src/db";
import postgres from "postgres";

describe("launch sorter", () => {
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

    test("sorting by time", async () => {
        const sortedByTime = await db.getSortedTokenLaunches({
            page: 1,
            limit: 10,
            orderBy: LaunchSortParameters.CREATED_AT,
            order: SortingOrder.HIGH_TO_LOW,
        }, client);
        assert(sortedByTime?.launchesChunk);

        let previousCreatedAt = sortedByTime.launchesChunk[0].createdAt;
        let previousPlatformShare = sortedByTime.launchesChunk[0].platformShare;

        for (const [index, launch] of sortedByTime.launchesChunk.entries()) {
            console.log(`#${index + 1} launch ${launch.address} | ${launch.createdAt} | ${launch.platformShare} | holders: ${launch.activeHolders}`);

            if (launch.createdAt > previousCreatedAt) console.error(`#${index + 1}: ${launch.createdAt} > ${previousCreatedAt}`);
            if (launch.platformShare > previousPlatformShare) console.error(`#${index + 1}: ${launch.platformShare} > ${previousPlatformShare}`);

            previousCreatedAt = launch.createdAt;
            previousPlatformShare = launch.platformShare;
        }
        console.log();
    });
    test("sorting by total value", async () => {
        const sortedByTime = await db.getSortedTokenLaunches({
            page: 1,
            limit: 10,
            orderBy: LaunchSortParameters.TOTAL_TONS_COLLECTED,
            order: SortingOrder.HIGH_TO_LOW,
        }, client);
        assert(sortedByTime?.launchesChunk);

        let previousTotalTonsCollected = sortedByTime.launchesChunk[0].totalTonsCollected;
        let previousPlatformShare = sortedByTime.launchesChunk[0].platformShare;

        for (const [index, launch] of sortedByTime.launchesChunk.entries()) {
            console.log(`#${index + 1} launch ${launch.address} | ${launch.totalTonsCollected} | ${launch.platformShare} | holders: ${launch.activeHolders}`);
            if (launch.totalTonsCollected > previousTotalTonsCollected) console.error(`#${index + 1}: ${launch.totalTonsCollected} > ${previousTotalTonsCollected}`);
            if (launch.platformShare > previousPlatformShare) console.error(`#${index + 1}: ${launch.platformShare} > ${previousPlatformShare}`);

            previousTotalTonsCollected = launch.totalTonsCollected;
            previousPlatformShare = launch.platformShare;
        }
        console.log();
    });
});

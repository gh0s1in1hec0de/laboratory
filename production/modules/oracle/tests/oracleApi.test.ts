import { GlobalVersions, LaunchSortParameters, SortingOrder, UserActionType } from "starton-periphery";
import { test, describe, beforeAll, afterAll, beforeEach } from "bun:test";
import { ok as assert } from "node:assert";
import * as db from "../src/db";
import postgres from "postgres";
import { getLaunch } from "../src/db";

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

    afterAll(async () => {
        await client.end();
    });
  
    // beforeEach(async () => {
    //     await client`
    //     TRUNCATE
    //         callers,
    //         heights,
    //         launch_balances,
    //         launch_metadata,
    //         earnings_per_period,
    //         tasks,
    //         token_launches,
    //         user_actions,
    //         user_balance_errors,
    //         user_balances,
    //         users_tasks_relations,
    //         whitelist_relations
    //     RESTART IDENTITY CASCADE;
    // `;
    // });

    test.skip("sorting by time", async () => {
        const sortedByTime = await db.getSortedTokenLaunches({
            page: 1,
            limit: 10,
            orderBy: LaunchSortParameters.CREATED_AT,
            order: SortingOrder.HIGH_TO_LOW,
        }, client);
        assert(sortedByTime?.launchesChunk);
        console.log("Launch format: ");
        console.log(sortedByTime.launchesChunk[0]);

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
    test.skip("sorting by total value", async () => {
        const sortedByTime = await db.getSortedTokenLaunches({
            page: 1,
            limit: 10,
            orderBy: LaunchSortParameters.TOTAL_TONS_COLLECTED,
            order: SortingOrder.HIGH_TO_LOW,
        }, client);
        assert(sortedByTime?.launchesChunk);
        console.log("Launch format: ");
        console.log(sortedByTime.launchesChunk[0]);

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
    test.skip("filtering", async () => {
        const sortedByTime = await db.getSortedTokenLaunches({
            page: 1,
            limit: 10,
            orderBy: LaunchSortParameters.TOTAL_TONS_COLLECTED,
            order: SortingOrder.HIGH_TO_LOW,
            // createdBy: "creator_1",
            // succeed: false,
            // search: "17"
        }, client);
        assert(sortedByTime?.launchesChunk);
        console.log("Launch format: ");
        console.log(sortedByTime.launchesChunk[0]);

        let previousTotalTonsCollected = sortedByTime.launchesChunk[0].totalTonsCollected;
        let previousPlatformShare = sortedByTime.launchesChunk[0].platformShare;

        for (const [index, launch] of sortedByTime.launchesChunk.entries()) {
            console.log(`#${index + 1} launch ${launch.address} | ${launch.totalTonsCollected} | ${launch.platformShare} | holders: ${launch.activeHolders} | is successful ${launch.isSuccessful}`);
            if (launch.totalTonsCollected > previousTotalTonsCollected) console.error(`#${index + 1}: ${launch.totalTonsCollected} > ${previousTotalTonsCollected}`);
            if (launch.platformShare > previousPlatformShare) console.error(`#${index + 1}: ${launch.platformShare} > ${previousPlatformShare}`);

            previousTotalTonsCollected = launch.totalTonsCollected;
            previousPlatformShare = launch.platformShare;
        }
        console.log();
    });
    test.skip("certain launch", async () => {
        const l = await db.getLaunch({
            // address: "addr_14",
            // metadataUri: "onchain_metadata_link_1"
        });
        assert(l);
        console.log(l);
    });
    test.skip("certain launch", async () => {
        const balances = await db.getCallerBalances("meow");
        assert(balances); console.log(balances);
    });
    test("mock launches activity data", async () => {
        const now = Math.floor(Date.now() / 1000);

        await db.storeLaunchMetadata({
            onchainMetadataLink: "link_1",
            telegramLink: "https://t.me/launch_1",
            xLink: "https://x.com/launch_1",
            website: "https://launch1.com",
            influencerSupport: true
        }, client);

        await db.storeLaunchMetadata({
            onchainMetadataLink: "link_2",
            telegramLink: "https://t.me/launch_2",
            xLink: "https://x.com/launch_2",
            website: "https://launch2.com",
            influencerSupport: false
        }, client);

        await db.storeLaunchMetadata({
            onchainMetadataLink: "link_3",
            telegramLink: "https://t.me/launch_3",
            xLink: "https://x.com/launch_3",
            website: "https://launch3.com",
            influencerSupport: true
        }, client);


        // Create Token Launch 1 (Outdated)
        await db.storeTokenLaunch({
            address: "launch_1",
            identifier: "Launch 1",
            creator: "creator_1",
            version: GlobalVersions.V2A,
            metadata: { uri: "link_1" },
            timings: {
                startTime: now - 60 * 60 * 24,  // Started 1 day ago
                creatorRoundEndTime: now - 60 * 60 * 18, // Ended 18 hours ago
                wlRoundEndTime: now - 60 * 60 * 12, // Ended 12 hours ago
                publicRoundEndTime: now - 60 * 60 * 6, // Ended 6 hours ago (outdated)
                endTime: now - 60 * 60 * 5  // Fully ended
            },
            totalSupply: 1000000000n,
            platformShare: 5.0,
            minTonTreshold: 1000000000000n,
            createdAt: now - 60 * 60 * 25 // Created 25 hours ago
        }, client);

        // Create Token Launch 2 (Active)
        await db.storeTokenLaunch({
            address: "launch_2",
            identifier: "Launch 2",
            creator: "creator_2",
            version: GlobalVersions.V2A,
            metadata: { uri: "link_2" },
            timings: {
                startTime: now - 60 * 60 * 12,  // Started 12 hours ago
                creatorRoundEndTime: now - 60 * 60 * 6, // Ended 6 hours ago
                wlRoundEndTime: now - 60 * 60 * 3, // Ended 3 hours ago
                publicRoundEndTime: now + 60 * 60 * 2, // Ends in 2 hours (active)
                endTime: now + 60 * 60 * 3 // Ends in 3 hours
            },
            totalSupply: 100000000n,
            platformShare: 4.0,
            minTonTreshold: 1000000000000n,
            createdAt: now - 60 * 60 * 13 // Created 13 hours ago
        }, client);

        // Create Token Launch 3 (Active)
        await db.storeTokenLaunch({
            address: "launch_3",
            identifier: "Launch 3",
            creator: "creator_3",
            version: GlobalVersions.V2A,
            metadata: { uri: "link_3" },
            timings: {
                startTime: now - 60 * 60 * 8,  // Started 8 hours ago
                creatorRoundEndTime: now - 60 * 60 * 4, // Ended 4 hours ago
                wlRoundEndTime: now - 60 * 60 * 2, // Ended 2 hours ago
                publicRoundEndTime: now + 60 * 60, // Ends in 1 hour (active)
                endTime: now + 60 * 60 * 2 // Ends in 2 hours
            },
            totalSupply: 750000n,
            platformShare: 3.5,
            minTonTreshold: 1000000000000n,
            createdAt: now - 60 * 60 * 9 // Created 9 hours ago
        }, client);

        // Insert 5 actions for Launch 1 (Outdated)
        for (let i = 0; i < 5; i++) {
            await db.storeUserAction({
                actor: `actor_${i + 1}`,
                tokenLaunch: "launch_1",
                actionType: UserActionType.WhiteListBuy,
                whitelistTons: 100n,
                publicTons: 0n,
                jettons: 0n,
                lt: BigInt(i + 1),
                timestamp: now - (60 * 60 * (i + 1)),  // Past actions
                queryId: BigInt(i + 1)
            }, client);
        }

        // Insert 4 actions for Launch 2 (Active)
        for (let i = 0; i < 4; i++) {
            await db.storeUserAction({
                actor: `actor_${i + 6}`,
                tokenLaunch: "launch_2",
                actionType: UserActionType.PublicBuy,
                whitelistTons: 0n,
                publicTons: 200n,
                jettons: 10n,
                lt: BigInt(i + 1),
                timestamp: now - (60 * 60 * (i + 1)),  // Past actions
                queryId: BigInt(i + 1)
            }, client);
        }

        // Insert 3 actions for Launch 3 (Active)
        for (let i = 0; i < 3; i++) {
            await db.storeUserAction({
                actor: `actor_${i + 10}`,
                tokenLaunch: "launch_3",
                actionType: UserActionType.WhiteListBuy,
                whitelistTons: 300n,
                publicTons: 0n,
                jettons: 0n,
                lt: BigInt(i + 1),
                timestamp: now - (60 * 60 * (i + 1)),  // Past actions
                queryId: BigInt(i + 1)
            }, client);
        }
    });
    test.skip("top activity materialized", async () => {
        console.log(await db.getLaunchWithTopActivity(client));
    });
});

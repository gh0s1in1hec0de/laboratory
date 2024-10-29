import { afterAll, beforeAll, describe, test } from "bun:test";
import { storeRewardJetton } from "manager/src/db";
import { randomAddress } from "@ton/test-utils";
import { ok as assert } from "node:assert";
import type { Address } from "@ton/ton";
import { toNano } from "@ton/core";
import postgres from "postgres";
import * as db from "../src/db";
import {
    type RawAddressString,
    LaunchSortParameters,
    type JettonMetadata,
    UserActionType,
    GlobalVersions,
    SortingOrder,
    jettonToNano
} from "starton-periphery";

async function markLaunchAsSuccessful(address: RawAddressString, client: db.SqlClient): Promise<void> {
    const res = await client`
        UPDATE token_launches
        SET is_successful = TRUE
        WHERE address = ${address}
        RETURNING 1;
    `;
    if (res.length !== 1) console.error(`looks like launch ${address} wasn't marked as failed`);
}

// TODO Test out
async function cleanDatabase(client: db.SqlClient, exceptions?: string[]) {
    const tables = await client`
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    `;
    const truncateAll = tables
        .map(t => t.tablename)
        .filter(name => !(exceptions ?? []).includes(name))
        .map(name => `TRUNCATE ${name} RESTART IDENTITY CASCADE`)
        .join("; ");
    truncateAll && await client.unsafe(truncateAll);
}

const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

describe("launch sorter", () => {
    let client: db.SqlClient;
    let launchAddresses: Address[];
    let creators: Address[];
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
    afterAll(async () => await client.end());

    // dondarubin🤡: don`t delete this!!!
    // gh0s1in1hec0de🗿: TODO Don't call it in beforeAll, call it directly only inside tests, that assume
    // TODO cleaning previous data to increase flexibility
    // beforeEach(async () => {
    //     cleanDatabase();
    // });

    test("extended launches data mock", async () => {
        const now = Math.floor(Date.now() / 1000);

        await db.storeLaunchMetadata({
            onchainMetadataLink: "https://ipfs.io/ipfs/QmVCMdxyudybb9vDefct1qU3DEZBhj3zhg3n9uM6EqGbN6",
            telegramLink: "https://t.me/juicy_bitches",
            xLink: "https://x.com/juicy_bitches",
            website: "https://juicy_bitches.cia",
            influencerSupport: true
        }, client);
        const metadata: JettonMetadata = {
            name: "Example Token",
            description: "This is an example token description",
            symbol: "EXM",
            decimals: "6",
            image: "https://ipfs.io/ipfs/Qmb4Yjspwz3gVq371wvVN9hqzzAoopzv5W1yS49qdTJJ7f",
            uri: "https://ipfs.io/ipfs/QmVCMdxyudybb9vDefct1qU3DEZBhj3zhg3n9uM6EqGbN6"
        };

        launchAddresses = Array.from({ length: 30 }, () => randomAddress());
        creators = Array.from({ length: 30 }, () => randomAddress());

        for (let i = 0; i < 5; i++) {
            await storeRewardJetton({
                masterAddress: randomAddress().toRawString(),
                ourWalletAddress: randomAddress().toRawString(),
                metadata,
                currentBalance: jettonToNano((i + 1) * 1000_000),
                rewardAmount: jettonToNano((i + 1) * 10_000)
            }, client);
        }

        // Current launches
        for (let i = 0; i < 15; i++) {
            const address = launchAddresses[i].toRawString();
            const timings = i < 5
                ? {
                    startTime: now - Math.floor(Math.random() * 3600 * 3),  // Up to 3 hours in the past
                    creatorRoundEndTime: now + 60 * 60 * 3 + Math.floor(Math.random() * 3600 * 2), // 3-5 hours in the future
                    wlRoundEndTime: now + 60 * 60 * 6 + Math.floor(Math.random() * 3600 * 2), // 6-8 hours in the future
                    publicRoundEndTime: now + 60 * 60 * 12 + Math.floor(Math.random() * 3600 * 2), // 12-14 hours in the future
                    endTime: now + 60 * 60 * 15 + Math.floor(Math.random() * 1800) // 15-15.5 hours in the future
                }
                : i < 10
                    ? {
                        startTime: now - 60 * 60 * 4 + Math.floor(Math.random() * 3600),  // 4 hours ago to 3 hours ago
                        creatorRoundEndTime: now - Math.floor(Math.random() * 3600),  // Up to 1 hour ago
                        wlRoundEndTime: now + 60 * 60 * 2 + Math.floor(Math.random() * 3600 * 2), // 2-4 hours in the future
                        publicRoundEndTime: now + 60 * 60 * 8 + Math.floor(Math.random() * 3600 * 2), // 8-10 hours in the future
                        endTime: now + 60 * 60 * 11 + Math.floor(Math.random() * 1800) // 11-11.5 hours in the future
                    }
                    : {
                        startTime: now - 60 * 60 * 8 + Math.floor(Math.random() * 3600 * 3),  // 8-5 hours ago
                        creatorRoundEndTime: now - 60 * 60 * 3 + Math.floor(Math.random() * 3600 * 2),  // 3-1 hours ago
                        wlRoundEndTime: now + 60 * 60 + Math.floor(Math.random() * 3600 * 2),  // 1-3 hours in the future
                        publicRoundEndTime: now + 60 * 60 * 5 + Math.floor(Math.random() * 3600 * 2), // 5-7 hours in the future
                        endTime: now + 60 * 60 * 9 + Math.floor(Math.random() * 1800) // 9-9.5 hours in the future
                    };
            await db.storeTokenLaunch({
                address,
                identifier: `${metadata.symbol} ${metadata.name ?? " "} ${metadata.description ?? " "}`.trim(),
                creator: creators[i].toRawString(),
                version: i % 2 === 0 ? GlobalVersions.V1 : GlobalVersions.V2,
                metadata, timings,
                totalSupply: jettonToNano(666_666),
                platformShare: i % 2 === 0 ? 0.5 : 1.5,
                minTonTreshold: toNano("1000"),
                createdAt: timings.startTime - 300
            }, client);

            await db.updateLaunchBalance(address, {
                creatorTonsCollected: toNano("1"),
                totalTonsCollected: toNano("1")
            }, client);

            if (i >= 5 && i < 10) {
                for (let i = 0; i < 5; i++) {
                    await db.storeUserAction({
                        actor: randomAddress().toRawString(),
                        tokenLaunch: address,
                        actionType: UserActionType.WhiteListBuy,
                        whitelistTons: toNano("1"),
                        publicTons: 0n,
                        jettons: 0n,
                        lt: BigInt(i + 1),
                        timestamp: randomBetween(timings.creatorRoundEndTime, timings.wlRoundEndTime),  // Past actions
                        queryId: BigInt(i + 1)
                    }, client);
                }
                await db.updateLaunchBalance(address, {
                    wlTonsCollected: toNano("5"),
                    totalTonsCollected: toNano("6")
                }, client);
            }
            if (i >= 10 && i < 15) {
                for (let i = 0; i < 5; i++) {
                    await db.storeUserAction({
                        actor: randomAddress().toRawString(),
                        tokenLaunch: address,
                        actionType: UserActionType.PublicBuy,
                        whitelistTons: 0n,
                        publicTons: toNano("1"),
                        jettons: (BigInt(i) + 1n) * jettonToNano("1"),
                        lt: BigInt(i + 1),
                        timestamp: randomBetween(timings.wlRoundEndTime, timings.publicRoundEndTime),
                        queryId: BigInt(i + 1)
                    }, client);
                }
                await db.updateLaunchBalance(address, {
                    totalTonsCollected: toNano("11")
                }, client);
            }

        }

        // Ended launches
        for (let i = 15; i < 30; i++) {
            const address = launchAddresses[i].toRawString();
            const timings = {
                startTime: now - 60 * 60 * 24 - Math.floor(Math.random() * 3600 * 3), // 1 day ago + random up to 3 hours
                creatorRoundEndTime: now - 60 * 60 * 18 - Math.floor(Math.random() * 3600 * 2), // 18 hrs ago + random up to 2 hours
                wlRoundEndTime: now - 60 * 60 * 12 - Math.floor(Math.random() * 3600 * 2), // 12 hrs ago + random up to 2 hours
                publicRoundEndTime: now - 60 * 60 * 6 - Math.floor(Math.random() * 3600), // 6 hrs ago + random up to 1 hour
                endTime: now - 60 * 60 * 5 - Math.floor(Math.random() * 1800) // 5 hrs ago + random up to 30 mins
            };
            await db.storeTokenLaunch({
                address,
                identifier: `${metadata.symbol} ${metadata.name ?? " "} ${metadata.description ?? " "}`.trim(),
                creator: creators[i].toRawString(),
                version: i % 2 === 0 ? GlobalVersions.V1 : GlobalVersions.V2,
                metadata, timings,
                totalSupply: jettonToNano(666_666),
                platformShare: i % 2 === 0 ? 0.5 : 1.5,
                minTonTreshold: toNano("1000"),
                createdAt: timings.startTime - 300
            }, client);

            for (let i = 0; i < 5; i++) {
                await db.storeUserAction({
                    actor: randomAddress().toRawString(),
                    tokenLaunch: address,
                    actionType: UserActionType.WhiteListBuy,
                    whitelistTons: toNano(i % 2 ? "200" : "20"),
                    publicTons: 0n,
                    jettons: 0n,
                    lt: BigInt(i + 1),
                    timestamp: randomBetween(timings.creatorRoundEndTime, timings.wlRoundEndTime),  // Past actions
                    queryId: BigInt(i + 1)
                }, client);
            }
            for (let i = 0; i < 5; i++) {
                await db.storeUserAction({
                    actor: randomAddress().toRawString(),
                    tokenLaunch: address,
                    actionType: UserActionType.PublicBuy,
                    whitelistTons: 0n,
                    publicTons: toNano(i % 2 ? "50" : "5"),
                    jettons: (BigInt(i) + 1n) * jettonToNano("1"),
                    lt: BigInt(i + 1),
                    timestamp: randomBetween(timings.wlRoundEndTime, timings.publicRoundEndTime),
                    queryId: BigInt(i + 1)
                }, client);
            }

            await db.updateLaunchBalance(address, {
                creatorTonsCollected: toNano(i % 2 ? "50" : "5"),
                wlTonsCollected: toNano(i % 2 ? "1000" : "100"),
                totalTonsCollected: toNano(i % 2 ? "1250" : "125")
            }, client);
            if (i % 2) {
                await markLaunchAsSuccessful(address, client);
                await db.updatePostDeployEnrollmentStats(
                    address,
                    {
                        deployedJetton: {
                            masterAddress: randomAddress().toRawString(),
                            ourWalletAddress: randomAddress().toRawString()
                        },
                        totalTonsCollected: toNano("1250").toString(),
                        ourJettonAmount: jettonToNano("5").toString(),
                        dexJettonAmount: jettonToNano("333").toString()
                    }, client
                );
            } else {
                await db.markLaunchAsFailed(address, client);
            }
        }
    });

    test.skip("mock launches activity data", async () => {
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
            version: GlobalVersions.V1,
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
            version: GlobalVersions.V1,
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
            version: GlobalVersions.V1,
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
            address: "addr_1",
            // metadataUri: "onchain_metadata_link_1"
        });
        assert(l);
        console.log(l);
    });
    test.skip("certain launch", async () => {
        const balances = await db.getCallerBalances("meow");
        assert(balances);
        console.log(balances);
    });
    test.skip("top activity materialized", async () => {
        console.log(await db.getLaunchWithTopActivity(client));
    });
});

import { Address, fromNano, internal as internal_relaxed, type OutActionSendMsg, SendMode } from "@ton/ton";
import { balancedTonClient, retrieveAllUnknownTransactions } from "./api.ts";
import { chief, getConfig } from "../config.ts";
import { createPoolForJetton } from "./dedust";
import { beginCell, toNano } from "@ton/core";
import { chiefWalletData } from "./highload";
import { logger } from "../logger.ts";
import { delay } from "../utils.ts";
import * as db from "../db";
import {
    DEFAULT_TIMEOUT, QUERY_ID_LENGTH,
    SUBWALLET_ID, OP_LENGTH,
    parseGetConfigResponse,
    loadOpAndQueryId,
    parseMoneyFlows,
    TokensLaunchOps,
    jettonFromNano,
    type Coins,
} from "starton-periphery";

export async function chiefScanning() {
    while (true) {
        try {
            // await validateEndedPendingLaunches();
            await delay(5);
            await createPoolsForNewJettons();
            await delay(5);
            await handleChiefUpdates();
        } catch (e) {
            logger().error("interplanetary error on chief's side: ", e);
            console.error(e);
            await delay(30);
        }
    }
}

async function validateEndedPendingLaunches() {
    try {
        const pendingLaunches = await db.getTokenLaunchesByCategories(db.EndedLaunchesCategories.Pending) ?? [];
        const waitingForJettonLaunches = await db.getTokenLaunchesByCategories(db.EndedLaunchesCategories.WaitingForJetton) ?? [];
        if (!(pendingLaunches.length || waitingForJettonLaunches.length)) {
            logger().info("no pending/waiting for jettons launches found");
            await delay(10);
            return;
        }

        const queryId = Math.floor(Date.now() / 1000);
        const { keyPair, wallet, queryIdManager } = await chiefWalletData();

        const actions: OutActionSendMsg[] = [];
        const failedLaunches: db.StoredTokenLaunch[] = [];
        for (const launch of pendingLaunches) {
            const { address } = launch;
            const launchAddressParsed = Address.parse(address);
            const [moneyFlowsResponse, getConfigCallResponse,] = await Promise.all([
                balancedTonClient.execute(c => c.runMethod(launchAddressParsed, "get_money_flows", []), true),
                balancedTonClient.execute(c => c.runMethod(launchAddressParsed, "get_config", []), true),
                delay(2)
            ]);
            const { totalTonsCollected } = parseMoneyFlows(moneyFlowsResponse.stack);
            const { minTonForSaleSuccess } = parseGetConfigResponse(getConfigCallResponse.stack);

            logger().debug(`found new ended launch ${launch.address} with ton stats c: ${fromNano(totalTonsCollected)} n: ${fromNano(minTonForSaleSuccess)}`);
            if (totalTonsCollected >= minTonForSaleSuccess) {
                waitingForJettonLaunches.push(launch);
                continue;
            }
            actions.push({
                type: "sendMsg",
                mode: SendMode.PAY_GAS_SEPARATELY,
                outMsg: internal_relaxed({
                    to: launchAddressParsed,
                    value: toNano("0.1"),
                    body: beginCell()
                        .storeUint(TokensLaunchOps.ClaimOpn, OP_LENGTH)
                        .storeUint(queryId, QUERY_ID_LENGTH)
                        .endCell()
                }),
            });
            logger().info(`[*] launch ${address} considered as failed`);
            failedLaunches.push(launch);
        }
        if (waitingForJettonLaunches.length) {
            logger().info("[*] found new successful launches: ");
            for (const { address } of waitingForJettonLaunches) {
                logger().info(` - ${address}`);
                actions.push({
                    type: "sendMsg",
                    mode: SendMode.PAY_GAS_SEPARATELY,
                    outMsg: internal_relaxed({
                        to: Address.parse(address),
                        value: toNano("1"),
                        body: beginCell()
                            .storeUint(TokensLaunchOps.DeployJetton, OP_LENGTH)
                            .storeUint(queryId, QUERY_ID_LENGTH)
                            .endCell()
                    }),
                });
            }
        }
        if (actions.length) {
            const highloadQueryId = await queryIdManager.getNextCached();
            await balancedTonClient.execute(() =>
                wallet.sendBatch(keyPair.secretKey,
                    actions,
                    SUBWALLET_ID,
                    highloadQueryId,
                    DEFAULT_TIMEOUT,
                )
            );
        }
        if (failedLaunches.length) {
            for (const { address } of failedLaunches) {
                await db.markLaunchAsFailed(address);
            }
        }
    } catch (e) {
        logger().error("failed to validate ended/pending launches with error ", e);
    }
}

async function createPoolsForNewJettons() {
    const waitingForPoolLaunches = await db.getTokenLaunchesByCategories(db.EndedLaunchesCategories.WaitingForPool);
    if (!waitingForPoolLaunches) {
        logger().info("no waiting for pool launches found");
        await delay(10);
        return;
    }
    const queryId = Math.floor(Date.now() / 1000);
    const { keyPair, wallet, queryIdManager } = await chiefWalletData();

    const actions: OutActionSendMsg[] = [];
    const poolCreationProcesses: Promise<void>[] = [];
    logger().info("[*] found new waiting for pool launches: ");
    for (const { address, creator, dexData, postDeployEnrollmentStats } of waitingForPoolLaunches) {
        const { deployedJetton, totalTonsCollected, dexAmount } = postDeployEnrollmentStats!;
        logger().info(` -  ${address}; payed to creator: ${dexData?.payedToCreator}`);
        actions.push({
            type: "sendMsg",
            mode: SendMode.PAY_GAS_SEPARATELY,
            outMsg: internal_relaxed({
                to: Address.parse(address),
                value: toNano("0.1"),
                body: beginCell()
                    .storeUint(TokensLaunchOps.ClaimOpn, OP_LENGTH)
                    .storeUint(queryId, QUERY_ID_LENGTH)
                    .endCell()
            }),
        });
        poolCreationProcesses.push(
            createPoolForJetton(
                {
                    ourWalletAddress: deployedJetton.ourWalletAddress,
                    masterAddress: deployedJetton.masterAddress,
                },
                [BigInt(totalTonsCollected) * BigInt(getConfig().sale.dex_share_pct) / 100n, BigInt(dexAmount)],
                address
            )
        );
        if (dexData?.payedToCreator) continue;
        actions.push({
            type: "sendMsg",
            mode: SendMode.PAY_GAS_SEPARATELY,
            outMsg: internal_relaxed({
                to: Address.parse(creator),
                value: BigInt(totalTonsCollected) * BigInt(getConfig().sale.creator_share_pct) / 100n,
                body: beginCell()
                    .storeUint(0, 32)
                    .storeStringRefTail("Ladies and gentlemen, we have now arrived at our destination. Thank you again for flying Starton, and we hope to see you on board again soon.")
                    .endCell()
            }),
        });
    }
    try {
        const highloadQueryId = await queryIdManager.getNextCached();
        await balancedTonClient.execute(() =>
            wallet.sendBatch(keyPair.secretKey,
                actions,
                SUBWALLET_ID,
                highloadQueryId,
                DEFAULT_TIMEOUT,
            )
        );
        for (const { address, dexData } of waitingForPoolLaunches) {
            if (dexData?.payedToCreator) continue;
            let newDexData: db.DexData;
            if (dexData) {
                newDexData = dexData;
                newDexData.payedToCreator = true;
            } else {
                newDexData = { addedLiquidity: false, payedToCreator: true };
            }
            await db.updateDexData(address, newDexData);
        }
    } catch (e) {
        logger().error("failed to send actions to wallet with error", e);
    }
    await Promise.allSettled(poolCreationProcesses);
}

async function handleChiefUpdates() {
    const chiefAddress = Address.parse(chief().address).toRawString();
    try {
        let currentHeight = await db.getHeight(chiefAddress) ?? 0n;
        const newTxs = await retrieveAllUnknownTransactions(chiefAddress, currentHeight);
        if (!newTxs) {
            logger().info("updates for chief not found");
            await delay(10);
            return;
        }
        for (const tx of newTxs) {
            const inMsg = tx.inMessage;
            if (!inMsg) continue;
            if (inMsg.info.type !== "internal") continue;

            const sender = inMsg.info.src;
            const value: Coins = inMsg.info.value.coins;
            const inMsgBody = inMsg.body.beginParse();
            // We don't care about simple transfers
            if (inMsgBody.remainingBits < (32 + 64)) continue;
            const { msgBodyData, op } = await loadOpAndQueryId(inMsgBody);

            if (op === 0x7362d09c) {
                const jettonAmount = msgBodyData.loadCoins();
                const originalSender = msgBodyData.loadAddress();
                const forwardPayload = msgBodyData.loadBit() ? msgBodyData.loadRef().beginParse() : msgBodyData;

                // IMPORTANT: we have to verify the source of this message because it can be faked
                const runStack = (await balancedTonClient.execute(c => c.runMethod(sender, "get_wallet_data"), true)).stack;
                runStack.skip(2);
                const jettonMaster = runStack.readAddress();
                const jettonWallet = (
                    await balancedTonClient.execute(
                        c => c.runMethod(jettonMaster, "get_wallet_address", [
                            {
                                type: "slice",
                                cell: beginCell().storeAddress(Address.parse(chief().address)).endCell()
                            }
                        ]), true
                    )).stack.readAddress();
                if (!jettonWallet.equals(sender)) {
                    // if sender is not our real JettonWallet: this message was faked
                    logger().warn(`this bitch ${sender} tried to fake transfer $$$$`);
                    continue;
                }

                try {
                    const dexAmount = forwardPayload.loadCoins();
                    const oursAmount = forwardPayload.loadCoins();
                    logger().info(`launch ${sender} enrollment: [${fromNano(value)} TONs, ${jettonFromNano(oursAmount)}, ${jettonFromNano(dexAmount)}]`);
                    await db.updatePostDeployEnrollmentStats(
                        originalSender.toRawString(),
                        {
                            deployedJetton: {
                                masterAddress: jettonMaster.toRawString(),
                                ourWalletAddress: sender.toRawString()
                            },
                            totalTonsCollected: value.toString(),
                            oursAmount: oursAmount.toString(),
                            dexAmount: dexAmount.toString()
                        }
                    );
                } catch (e) {
                    logger().warn(`jetton transfer from ${originalSender} with value ${jettonFromNano(jettonAmount)} and without shares (or an error for right one)`, e);
                    console.error(e);
                }
            }
        }
        currentHeight = newTxs[newTxs.length - 1].lt;
        await db.setHeightForAddress(chiefAddress, currentHeight, true);
    } catch (e) {
        logger().error(`failed to load chief(${chiefAddress}) updates with error: `, e);
    }
}
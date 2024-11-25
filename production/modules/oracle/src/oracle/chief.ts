import { Address, fromNano, internal as internal_relaxed, type OutActionSendMsg, SendMode } from "@ton/ton";
import { createPoolForJetton } from "./dedust";
import { beginCell, toNano } from "@ton/core";
import { balancedTonClient } from "./client";
import { chief, getConfig } from "../config";
import { chiefWalletData } from "./highload";
import { logger } from "../logger";
import * as db from "../db";
import {
    DEFAULT_TIMEOUT, QUERY_ID_LENGTH,
    retrieveAllUnknownTransactions,
    SUBWALLET_ID, OP_LENGTH,
    type StoredTokenLaunch,
    parseGetConfigResponse,
    loadOpAndQueryId,
    parseMoneyFlows,
    TokensLaunchOps,
    jettonFromNano,
    type DexData,
    type Coins,
    delay,
} from "starton-periphery";

export async function chiefScanning() {
    while (true) {
        try {
            await validateEndedPendingLaunches();
            await delay(7.5);
            await createPoolsForNewJettons();
            await delay(7.5);
            await handleChiefUpdates();
        } catch (e) {
            logger().error("interplanetary error on chief's side: ", e);
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
            await delay(15);
            return;
        }

        const queryId = Math.floor(Date.now() / 1000);
        const actions: OutActionSendMsg[] = [];
        const failedLaunches: StoredTokenLaunch[] = [];

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
                    value: toNano("0.05"),
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
            const { keyPair, wallet, queryIdManager } = await chiefWalletData();
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
        await delay(15);
        return;
    }
    const queryId = Math.floor(Date.now() / 1000);

    const actions: OutActionSendMsg[] = [];
    const poolCreationProcesses: Promise<void>[] = [];
    logger().info("[*] found new waiting for pool launches: ");
    for (const { address, creator, dexData, postDeployEnrollmentStats, metadata } of waitingForPoolLaunches) {
        const { deployedJetton, totalTonsCollected, dexJettonAmount } = postDeployEnrollmentStats!;
        logger().info(` -  ${address}; payed to creator: ${dexData?.payedToCreator}`);
        actions.push({
            type: "sendMsg",
            mode: SendMode.PAY_GAS_SEPARATELY,
            outMsg: internal_relaxed({
                to: Address.parse(address),
                value: toNano("0.05"),
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
                [BigInt(totalTonsCollected) * BigInt(getConfig().sale.dex_share_pct) / 100n, BigInt(dexJettonAmount)],
                address
            )
        );
        const creatorsValue = BigInt(totalTonsCollected) * BigInt(getConfig().sale.creator_share_pct) / 100n;
        actions.push({
            type: "sendMsg",
            mode: SendMode.PAY_GAS_SEPARATELY,
            outMsg: internal_relaxed({
                // We'll send rewards firstly on our inner wallet if it is too huge
                to: Address.parse(dexData?.payedToCreator || creatorsValue > toNano("1000") ? getConfig().oracle.chief.fallback_vault : creator),
                value: BigInt(totalTonsCollected) * BigInt(getConfig().sale.creator_share_pct) / 100n,
                body: beginCell()
                    .storeUint(0, 32)
                    .storeStringRefTail(`Founder's share for ${metadata.name}'s launch, thanks for choosing starton^^`)
                    .endCell()
            }),
        });
    }
    try {
        const { keyPair, wallet, queryIdManager } = await chiefWalletData();
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
            let newDexData: DexData;
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
        const newTxs = await retrieveAllUnknownTransactions(chiefAddress, currentHeight, logger, balancedTonClient);
        if (!newTxs) {
            logger().info("updates for chief not found");
            await delay(15);
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
                            ourJettonAmount: oursAmount.toString(),
                            dexJettonAmount: dexAmount.toString()
                        }
                    );
                } catch (e) {
                    // Expected to be thrown at LPs enrollment
                    logger().warn(`jetton transfer from ${originalSender} with value ${jettonFromNano(jettonAmount)} and without shares (or an error for correct one)`, e);
                }
            }
        }
        currentHeight = newTxs[newTxs.length - 1].lt;
        await db.setHeightForAddress(chiefAddress, currentHeight, true);
    } catch (e) {
        logger().error(`failed to load chief(${chiefAddress}) updates with error: `, e);
    }
}
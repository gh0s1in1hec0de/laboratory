import { Address, internal as internal_relaxed, type OutActionSendMsg, SendMode } from "@ton/ton";
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
} from "starton-periphery";

export async function chiefScanning() {
    while (true) {
        try {
            await validateEndedPendingLaunches();
            await delay(5);
            await createPoolsForNewJettons();
            await delay(5);
            await handleChiefUpdates();
        } catch (e) {
            logger().error("interplanetary error on chief's side: ", e);
            await delay(30);
        }
    }
}

async function validateEndedPendingLaunches() {
    try {
        const pendingLaunches = await db.getTokenLaunchesByCategories([db.EndedLaunchesCategories.Pending]);
        const waitingForJettonLaunches = await db.getTokenLaunchesByCategories([db.EndedLaunchesCategories.WaitingForJetton]) ?? [];
        if (!(pendingLaunches && waitingForJettonLaunches.length)) return;

        const queryId = Date.now() / 1000;
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
            logger().debug(`launch ${address} considered as failed`);
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
    const waitingForPoolLaunches = await db.getTokenLaunchesByCategories([db.EndedLaunchesCategories.WaitingForPool]);
    if (!waitingForPoolLaunches) return;
    const queryId = Date.now() / 1000;
    const { keyPair, wallet, queryIdManager } = await chiefWalletData();


    const actions: OutActionSendMsg[] = [];
    const poolCreationProcesses: Promise<void>[] = [];
    for (const { address, creator, dexData, postDeployEnrollmentStats } of waitingForPoolLaunches) {
        const { deployedJetton, totalTonsCollected, dexAmount } = postDeployEnrollmentStats!;
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
                [totalTonsCollected * BigInt(getConfig().sale.dex_share_pct / 100), dexAmount],
                address
            )
        );
        if (dexData?.payedToCreator) continue;
        actions.push({
            type: "sendMsg",
            mode: SendMode.PAY_GAS_SEPARATELY,
            outMsg: internal_relaxed({
                to: Address.parse(creator),
                value: totalTonsCollected * BigInt(getConfig().sale.creator_share_pct / 100),
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
    try {
        let currentHeight = await db.getHeight(chief().address) ?? 0n;
        const newTxs = await retrieveAllUnknownTransactions(chief().address, currentHeight);
        if (!newTxs) {
            logger().info("no updates for chief");
            return;
        }
        for (const tx of newTxs) {
            const inMsg = tx.inMessage;
            if (!inMsg) continue;
            if (inMsg.info.type !== "internal") continue;

            const sender = inMsg.info.src;
            const value = inMsg.info.value.coins;
            const inMsgBody = inMsg.body.beginParse();
            // We don't care about simple transfers
            if (inMsgBody.remainingBits < (32 + 64)) continue;
            const { msgBodyData, op } = await loadOpAndQueryId(inMsgBody);

            if (op === 0x7362d09c) {
                const jettonAmount = msgBodyData.loadCoins();
                const originalSender = msgBodyData.loadAddressAny();
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

                if (forwardPayload.remainingBits < 248) {
                    logger().info(`side jetton transfer from ${originalSender} with value ${jettonFromNano(jettonAmount)}`);
                    continue;
                }
                try {
                    const dexAmount = forwardPayload.loadCoins();
                    const oursAmount = forwardPayload.loadCoins();
                    await db.updatePostDeployEnrollmentStats(
                        (originalSender as Address).toRawString(),
                        {
                            deployedJetton: {
                                masterAddress: jettonMaster.toRawString(),
                                ourWalletAddress: sender.toRawString()
                            },
                            totalTonsCollected: value,
                            oursAmount,
                            dexAmount
                        }
                    );
                } catch (e) {
                    logger().error(`error when parsing forward payload for tx with lt ${tx.lt}: `, e);
                }
            }
        }
        currentHeight = newTxs[newTxs.length - 1].lt;
        await db.setHeightForAddress(chief().address, currentHeight, true);
    } catch (e) {
        logger().error(`failed to load chief(${chief().address}) updates with error: `, e);
    }
}
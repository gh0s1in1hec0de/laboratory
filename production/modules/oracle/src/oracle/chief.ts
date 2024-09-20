import { buildInternalMessage, getChiefWalletContract, sendToWallet } from "./highload/walletInteractions.ts";
import { balancedTonClient, retrieveAllUnknownTransactions } from "./api.ts";
import { createPoolForJetton } from "./dedust.ts";
import { chief, getConfig } from "../config.ts";
import { beginCell, toNano } from "@ton/core";
import { Address, internal } from "@ton/ton";
import { logger } from "../logger.ts";
import { delay } from "../utils.ts";
import * as db from "../db";
import {
    parseMoneyFlows, QUERY_ID_LENGTH,
    loadOpAndQueryId, OP_LENGTH,
    parseGetConfigResponse,
    TokensLaunchOps,
    jettonFromNano,
} from "starton-periphery";

/*
    In a number of moments in the code below it would be possible to operate in parallel,
    but this was moderately replaced by synchronous code due to the greater stability of certain processes
    and the unnecessity of extraordinary speed of their execution
*/

export async function chiefScanning() {
    while (true) {
        try {
            await validateEndedPendingLaunches();
            await delay(5);
            await createPoolsForNewJettons();
            await delay(60);
            await handleChiefUpdates();
        } catch (e) {
            logger().error("interplanetary error on chief's side: ", e);
            await delay(60);
        }
    }
}

async function validateEndedPendingLaunches() {
    const chiefWallet = { address: Address.parse(chief().address), mnemonic: chief().mnemonic.split(" ") };
    const pendingLaunches = await db.getTokenLaunchesByCategories([db.EndedLaunchesCategories.Pending]);
    const waitingForJettonLaunches = await db.getTokenLaunchesByCategories([db.EndedLaunchesCategories.WaitingForJetton]) ?? [];
    if (!(pendingLaunches && waitingForJettonLaunches.length)) return;

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
        await db.markLaunchAsFailed(address);
        const claimOpnMessage = buildInternalMessage(
            launchAddressParsed,
            toNano("0.1"),
            beginCell()
                .storeUint(TokensLaunchOps.ClaimOpn, OP_LENGTH)
                .storeUint(Date.now(), QUERY_ID_LENGTH)
                .endCell()
        );
        await sendToWallet(chiefWallet, claimOpnMessage);
        await delay(0.5);
    }
    for (const { address } of waitingForJettonLaunches) {
        const deployMessage = buildInternalMessage(
            Address.parse(address),
            toNano("1"),
            beginCell()
                .storeUint(TokensLaunchOps.DeployJetton, OP_LENGTH)
                .storeUint(Date.now(), QUERY_ID_LENGTH)
                .endCell()
        );
        await sendToWallet(chiefWallet, deployMessage);
        await delay(0.5);
    }

}

async function createPoolsForNewJettons() {
    const waitingForPoolLaunches = await db.getTokenLaunchesByCategories([db.EndedLaunchesCategories.WaitingForPool]);
    if (!waitingForPoolLaunches) return;

    const poolCreationProcesses: Promise<void>[] = [];
    for (const launch of waitingForPoolLaunches) {
        try {
            const { deployedJetton, totalTonsCollected, dexAmount } = launch.postDeployEnrollmentStats!;

            if (!launch.dexData?.payedToCreator) {
                const { chiefKeyPair, chiefWalletContract } = await getChiefWalletContract();
                const seqno = await chiefWalletContract.getSeqno();
                await chiefWalletContract.sendTransfer({
                    seqno, secretKey: chiefKeyPair.secretKey,
                    messages: [internal({
                        to: Address.parse(launch.creator),
                        value: totalTonsCollected * BigInt(getConfig().sale.creator_share_pct / 100),
                        bounce: true,
                        body: beginCell()
                            .storeUint(0, 32)
                            .storeStringRefTail("Ladies and gentlemen, we have now arrived at our destination. Thank you again for flying Starton, and we hope to see you on board again soon.")
                            .endCell()
                    })]
                });
                let newDexData: db.DexData;
                if (launch.dexData) {
                    newDexData = launch.dexData;
                    newDexData.payedToCreator = true;
                } else {
                    newDexData = { addedLiquidity: false, payedToCreator: true };
                }
                await db.updateDexData(launch.address, newDexData);
            }
            poolCreationProcesses.push(
                createPoolForJetton(
                    {
                        ourWalletAddress: deployedJetton.ourWalletAddress,
                        masterAddress: deployedJetton.masterAddress,
                    },
                    [totalTonsCollected * BigInt(getConfig().sale.dex_share_pct / 100), dexAmount],
                    launch.address
                )
            );
        } catch (e) {
            logger().warn(`failed to initiate pool creation process for launch ${launch.address} with error: `, e);
        }
    }
    await Promise.allSettled(poolCreationProcesses);
}

async function handleChiefUpdates() {
    try {
        let currentHeight = await db.getHeight(chief().address) ?? 0n;
        const newTxs = await retrieveAllUnknownTransactions(chief().address, currentHeight);
        if (!newTxs.length) return;
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
                const runStack = (await balancedTonClient.execute(c => c.runMethod(sender, "get_wallet_data"))).stack;
                runStack.skip(2); // TODO Test in sandbox
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
                    logger().error("error when parsing forward payload: ", e);
                }
            }
        }
        currentHeight = newTxs[newTxs.length - 1].lt;
        await db.setHeightForAddress(chief().address, currentHeight, true);
    } catch (e) {
        logger().error(`failed to load chief(${chief().address}) updates with error: `, e);
    }
}
import { balancedTonClient, retrieveAllUnknownTransactions } from "./api";
import { Address, fromNano } from "@ton/ton";
import { ok as assert } from "node:assert";
import { logger } from "../logger";
import { delay } from "../utils";
import * as db from "../db";
import {
    MAX_WL_ROUND_TON_LIMIT,
    parseGetConfigResponse,
    type RawAddressString,
    parseBalanceUpdate,
    parseRefundOrClaim,
    BalanceUpdateMode,
    type LamportTime,
    loadOpAndQueryId,
    TokensLaunchOps,
    parseMoneyFlows,
    jettonFromNano,
    UserVaultOps,
    parseTimings,
} from "starton-periphery";

export async function spawnNewLaunchesScanners(scanFrom?: number) {
    let timeUpdate = scanFrom;
    while (true) {
        try {
            const newLaunches = await db.getActiveTokenLaunches(timeUpdate);
            if (!newLaunches) {
                logger().info(`[*] ${spawnNewLaunchesScanners.name} - no active launches found`); // THIS CODE IS A FUCKING JOKE BTW
                await delay(30);
                continue;
            }
            logger().info(`[*] ${spawnNewLaunchesScanners.name} - found ${newLaunches.length} new launches: `);
            for (const { address } of newLaunches) {
                logger().info(` -  ${address}`);
            }
            for (const launch of newLaunches) {
                balancedTonClient.incrementActiveLaunchesAmount();
                handleTokenLaunchUpdates(launch);
                await delay(1); // As we don't want all the api requests in the same moment
            }
            timeUpdate = newLaunches.reduce((latest, launch) => {
                return launch.createdAt > latest ? launch.createdAt : latest;
            }, newLaunches[0].createdAt);
            logger().debug(`[*] ${spawnNewLaunchesScanners.name}: scan from time was set to ${timeUpdate}`);
            await delay(1);
        } catch (e) {
            logger().error("failed to spawn new launch scanner with error ", e);
        }
    }
}

async function handleTokenLaunchUpdates(tokenLaunch?: db.StoredTokenLaunch, launchAddress?: RawAddressString,) {
    assert(launchAddress || tokenLaunch, "must provide launch data or an address");
    const launch = tokenLaunch ?? await db.getTokenLaunch(launchAddress!);
    if (!launch) {
        logger().error(`launch ${launchAddress} not found in database`);
        return;
    }
    logger().info(`new token launch updates handler for ${launch.address} is up`);
    let currentHeight = await db.getLaunchHeight(launch.address) ?? 0n;
    let endTimeMs = launch.timings.endTime * 1000;

    while (true) {
        try {
            const newTxs = await retrieveAllUnknownTransactions(launch.address, currentHeight);
            if (!newTxs) {
                const delayTime = endTimeMs - Date.now() > 86_400_000 ? balancedTonClient.delayValue() : 300;
                logger().debug(`no updates found for launch ${launch.address}, sleeping for ${delayTime} seconds`);
                await delay(delayTime);
                continue;
            }
            const newActionsChunk: db.UserAction[] = [];
            for (const tx of newTxs) {
                const userActions: db.UserAction[] = [];
                const inMsg = tx.inMessage;
                if (!inMsg) continue;
                if (inMsg.info.type !== "internal" || inMsg.info.bounced) continue;

                const lt: LamportTime = tx.lt;
                const inMsgSender = inMsg.info.src;
                const inMsgBody = inMsg.body.beginParse();
                // We don't care about simple transfers
                if (inMsgBody.remainingBits < (32 + 64)) continue;

                const { msgBodyData, op, queryId } = await loadOpAndQueryId(inMsgBody);
                if ([TokensLaunchOps.JettonClaimConfirmation, TokensLaunchOps.RefundConfirmation].includes(op)) {
                    const {
                        whitelistTons,
                        publicTons,
                        futureJettons,
                        recipient,
                        mode
                    } = parseRefundOrClaim(op, msgBodyData);
                    logger().debug(`launch ${launch.address}: new operation ${op}:${mode} - [${fromNano(whitelistTons)}; ${fromNano(publicTons)}; ${jettonFromNano(futureJettons)}]`);
                    userActions.push({
                        actor: recipient,
                        tokenLaunch: launch.address,
                        actionType: mode !== undefined ? db.balanceUpdateModeToUserActionType[mode] : db.UserActionType.Claim,
                        whitelistTons,
                        publicTons,
                        jettons: futureJettons,
                        lt,
                        timestamp: tx.now,
                        queryId
                    } as db.UserAction);
                }
                if (op === TokensLaunchOps.CreatorBuyout) {
                    const configResponse = await balancedTonClient.execute(
                        c => c.runMethod(Address.parse(launch.address), "get_config", []), true
                    );
                    const {
                        creatorFutJetBalance,
                        creatorFutJetPriceReversed
                    } = parseGetConfigResponse(configResponse.stack);
                    const creatorTonsCollected = creatorFutJetBalance * MAX_WL_ROUND_TON_LIMIT / creatorFutJetPriceReversed;
                    logger().info(`launch ${launch.address}: creator's buyout on ${fromNano(creatorTonsCollected)} TONs is found`);
                    await db.updateLaunchBalance(launch.address, { creatorTonsCollected });
                }

                // Here we'll handle only DEPOSITING operations
                for (const [, msg] of tx.outMessages) {
                    if (msg.info.type !== "internal") continue;
                    if (msg.info.bounced) continue;
                    const originalBody = msg.body.beginParse();
                    const body = originalBody.clone();
                    if (body.remainingBits < 32) {
                        logger().warn(`launch ${launch.address}: unreachable tx (no op) to address ${msg.info.dest} with timestamp ${msg.info.createdAt}`);
                        continue;
                    }
                    const preloadedOp = body.loadUint(32);
                    if (preloadedOp === 0) {
                        const comment = body.loadStringTail();
                        switch (comment) {
                            case "^^!": {
                                const timingsResponse = await balancedTonClient.execute(
                                    c => c.runMethod(Address.parse(launch.address), "get_sale_timings", []), true
                                );
                                const newTimings = parseTimings(timingsResponse.stack);
                                await db.updateLaunchTimings(launch.address, newTimings);
                                endTimeMs = newTimings.endTime * 1000;
                                logger().info(`launch ${launch.address}: timings had been successfully updated (end time ${endTimeMs})`);
                                break;
                            }
                            case "opn": {
                                logger().debug(`launch ${launch.address}: detected new opn transfer with value ${fromNano(msg.info.value.coins)} TON`);
                                break;
                            }
                            case "crr": {
                                logger().info(`launch ${launch.address}: creator has refunded his TONs`);
                                await db.updateLaunchBalance(launch.address, { creatorTonsCollected: 0n });
                                break;
                            }
                            default:
                                logger().warn(`launch ${launch.address}: unknown outer transfer to ${msg.info.dest} with timestamp ${msg.info.createdAt} and comment ${comment}`);
                        }
                        continue;
                    }

                    const { msgBodyData, op, queryId } = await loadOpAndQueryId(originalBody);
                    // Then we'll look for following operation: balanceUpdate
                    if (op !== UserVaultOps.balanceUpdate) continue;
                    const { mode, tons, futureJettons } = parseBalanceUpdate(msgBodyData);
                    if (![BalanceUpdateMode.PublicDeposit, BalanceUpdateMode.WhitelistDeposit].includes(mode)) continue;
                    logger().debug(`launch ${launch.address}: new operation ${op} - [${fromNano(tons)}; ${jettonFromNano(futureJettons)}]`);

                    const [whitelistTons, publicTons] =
                        mode === BalanceUpdateMode.WhitelistDeposit ? [tons, 0n] : [0n, tons];
                    userActions.push({
                        actor: inMsgSender.toRawString(),
                        tokenLaunch: launch.address,
                        actionType: db.balanceUpdateModeToUserActionType[mode],
                        whitelistTons,
                        publicTons,
                        jettons: futureJettons,
                        lt,
                        timestamp: tx.now,
                        queryId
                    } as db.UserAction);
                }
                newActionsChunk.push(...userActions);
            }
            // We are not using sql transaction here intentionally
            for (const action of newActionsChunk) {
                // Catching every error separately to prevent record stoppage and transaction congestion
                // Theoretically, it should never trigger
                try {
                    await db.storeUserAction(action);
                } catch (e) {
                    logger().error(`launch ${launch.address}: action[${action.actor}; ${action.timestamp}] record error: ${e}`);
                }
            }
            currentHeight = newTxs[newTxs.length - 1].lt;
            const moneyFlowsResponse = await balancedTonClient.execute(c => c.runMethod(Address.parse(launch.address), "get_money_flows", []), true);
            const { totalTonsCollected, wlRoundTonInvestedTotal } = parseMoneyFlows(moneyFlowsResponse.stack);
            await db.updateLaunchBalance(launch.address, {
                totalTonsCollected,
                wlTonsCollected: wlRoundTonInvestedTotal
            });

            if (Date.now() > endTimeMs) {
                balancedTonClient.decrementActiveLaunchesAmount();
                logger().info(`new token launch updates handler for ${launch.address} is self-terminated`);
                break;
            } // 10 interval mins if we passed the end time
            const delayTime = endTimeMs - Date.now() > 86_400_000 ? balancedTonClient.delayValue() : 600;
            logger().debug(`operations for ${launch.address} was recorded successfully - waiting for ${delayTime} seconds`);
            await delay(delayTime);
        } catch (e) {
            logger().error(`failed to handle launch ${launch.address} update with general error: `, e);
            await delay(balancedTonClient.delayValue() / 2);
        }
    }
}
import { buildInternalMessage, sendToWallet } from "./walletInteractions.ts";
import { balancedTonClient, retrieveAllUnknownTransactions } from "./api.ts";
import { beginCell, toNano } from "@ton/core";
import { logger } from "../logger.ts";
import { chief } from "../config.ts";
import { delay } from "../utils.ts";
import { Address } from "@ton/ton";
import * as db from "../db";
import {
    parseMoneyFlows, QUERY_ID_LENGTH,
    loadOpAndQueryId, OP_LENGTH,
    parseGetConfigResponse,
    type RawAddressString,
    TokensLaunchOps,
} from "starton-periphery";

/*
    What do we need to do here? Two main parts - triggering jetton deployment process from successful launches
     and retrieving transactions with incoming jettons to create pool with it. Also, collecting fee in the end of launch.
*/
export async function validateEndedPendingLaunches() {
    while (true) {
        const middleLaunches = await db.getTokenLaunchesByCategory(db.EndedLaunchesCategories.Pending);
        if (!middleLaunches) {
            await delay(100);
            continue;
        }
        for (const { address } of middleLaunches) {
            const launchAddressParsed = Address.parse(address);
            const [moneyFlowsResponse, getConfigCallResponse] = await Promise.all([
                balancedTonClient.execute(c => c.runMethod(launchAddressParsed, "get_money_flows", [])),
                balancedTonClient.execute(c => c.runMethod(launchAddressParsed, "get_config", []))
            ]);
            const { totalTonsCollected } = parseMoneyFlows(moneyFlowsResponse.stack);
            const { minTonForSaleSuccess } = parseGetConfigResponse(getConfigCallResponse.stack);
            if (totalTonsCollected < minTonForSaleSuccess) {
                await db.markLaunchAsFailed(address);
                // TODO Send collect fee, what about successful launches - we'll collect fee after deployment for safety
                continue;
            }
            const deployMessage = buildInternalMessage(
                launchAddressParsed,
                toNano("1"),
                beginCell()
                    .storeUint(TokensLaunchOps.DeployJetton, OP_LENGTH)
                    .storeUint(Date.now(), QUERY_ID_LENGTH)
                    .endCell()
            );
            await sendToWallet(
                { address: Address.parse(chief().address), mnemonic: chief().mnemonic.split(" ") },
                balancedTonClient,
                deployMessage
            );
        }
    }
}

export async function handleChiefUpdates(chiefAddress: RawAddressString) {
    let currentHeight = await db.getHeight(chiefAddress) ?? 0n;
    let iteration = 0;
    while (true) {
        try {
            const newTxs = await retrieveAllUnknownTransactions(chiefAddress, currentHeight);
            if (!newTxs.length) {
                await delay(5);
                continue;
            }
            for (const tx of newTxs) {
                const inMsg = tx.inMessage;
                if (!inMsg) continue;
                if (inMsg.info.type !== "internal") continue;


                for (const [, msg] of tx.outMessages) {
                    const outMsgBody = msg.body.beginParse();
                    if (outMsgBody.remainingBits < (32 + 64)) continue;
                    const { op } = await loadOpAndQueryId(outMsgBody);

                }
            }
            currentHeight = newTxs[newTxs.length - 1].lt;
            iteration += 1;
            if (iteration % 5 === 0) await db.setHeightForAddress(chiefAddress, currentHeight, true);
            await delay(15);
        } catch (e) {
            logger().error(`failed to load new launches for chief(${chiefAddress}) update with error: ${e}`);
        }
    }
}
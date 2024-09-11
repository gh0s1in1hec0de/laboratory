import { Asset, Factory, MAINNET_FACTORY_ADDR, ReadinessStatus } from "@dedust/sdk";
import { balancedTonClient, retrieveAllUnknownTransactions } from "./api.ts";
import { buildInternalMessage, sendToWallet } from "./walletInteractions.ts";
import { Address, WalletContractV4 } from "@ton/ton";
import { beginCell, toNano } from "@ton/core";
import { logger } from "../logger.ts";
import { chief } from "../config.ts";
import { delay } from "../utils.ts";
import * as db from "../db";
import {
    parseMoneyFlows, QUERY_ID_LENGTH,
    loadOpAndQueryId, OP_LENGTH,
    parseGetConfigResponse,
    TokensLaunchOps,
    jettonFromNano, BASECHAIN,
} from "starton-periphery";
import { mnemonicToWalletKey } from "@ton/crypto";

/*
    What do we need to do here? Two main parts - triggering jetton deployment process from successful launches
     and retrieving transactions with incoming jettons to create pool with it. Also, collecting fee in the end of launch.
*/

export async function validateEndedPendingLaunches() {
    const chiefWallet = { address: Address.parse(chief().address), mnemonic: chief().mnemonic.split(" ") };
    const pendingLaunches = await db.getTokenLaunchesByCategories([db.EndedLaunchesCategories.Pending]);
    const waitingForJettonLaunches = await db.getTokenLaunchesByCategories([db.EndedLaunchesCategories.WaitingForJetton]) ?? [];
    if (!(pendingLaunches && waitingForJettonLaunches.length)) return;

    for (const launch of pendingLaunches) {
        const { address } = launch;
        const launchAddressParsed = Address.parse(address);
        const [moneyFlowsResponse, getConfigCallResponse,] = await Promise.all([
            balancedTonClient.execute(c => c.runMethod(launchAddressParsed, "get_money_flows", [])),
            balancedTonClient.execute(c => c.runMethod(launchAddressParsed, "get_config", [])),
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
    }

}

export async function createPoolsForNewJettons() {
    const waitingForPoolLaunches = await db.getTokenLaunchesByCategories([db.EndedLaunchesCategories.WaitingForPool]);
    if (!waitingForPoolLaunches) return;

    const keyPair = await mnemonicToWalletKey(chief().mnemonic.split(" "));
    const chiefWallet = await balancedTonClient.execute(
        c => c.open(
            WalletContractV4.create({
                workchain: BASECHAIN,
                publicKey: keyPair.publicKey,
            })
        )
    );

    for (const launch of waitingForPoolLaunches) {
        const { deployedJetton, totalTonsCollected, dexAmount } = launch.postDeployEnrollmentStats!;
        const asset = Asset.jetton(Address.parse(deployedJetton.masterAddress));
        const assets: [Asset, Asset] = [Asset.native(), asset];

        const factory = await balancedTonClient.execute(c => c.open(Factory.createFromAddress(MAINNET_FACTORY_ADDR)));
        const derivedJettonVault = await factory.getJettonVault(Address.parse(deployedJetton.masterAddress));
        const derivedJettonVaultContract = await balancedTonClient.execute(c => c.open(derivedJettonVault));
        const vaultStatus = await derivedJettonVaultContract.getReadinessStatus();

        if (vaultStatus === ReadinessStatus.NOT_DEPLOYED) {
            await factory.sendCreateVault(chiefWallet.sender(keyPair.secretKey), { asset });
        }
        // TODO Rest of method

    }

}

export async function handleChiefUpdates() {
    let currentHeight = await db.getHeight(chief().address) ?? 0n;
    let iteration = 0;
    while (true) {
        try {
            const newTxs = await retrieveAllUnknownTransactions(chief().address, currentHeight);
            if (!newTxs.length) {
                await delay(5);
                continue;
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
                            ])
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
            iteration += 1;
            if (iteration % 5 === 0) await db.setHeightForAddress(chief().address, currentHeight, true);
            await delay(60);
        } catch (e) {
            logger().error(`failed to load chief(${chief().address}) updates with error: `, e);
            await delay(30);
        }
    }
}
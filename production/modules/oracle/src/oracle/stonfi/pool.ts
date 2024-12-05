import type { Coins, DexData, RawAddressString } from "starton-periphery";
import { SUBWALLET_ID, DEFAULT_TIMEOUT, delay, } from "starton-periphery";
import { Address, type SenderArguments, SendMode } from "@ton/ton";
import { internal as internal_relaxed } from "@ton/core";
import { balancedTonClient } from "../client";
import { chiefWalletData } from "../highload";
import { DEX, pTON } from "@ston-fi/sdk";
import { logger } from "../../logger";
import * as db from "../../db";

const STONFI_ROUTER_V2_1_ADDRESS = "kQALh-JBBIKK7gr0o4AVf9JZnEsFndqO0qTCyT-D-yBsWk0v";
const STONFI_PTON_V2_1_ADDRESS = "kQACS30DNoUQ7NfApPvzh7eBmSZ9L4ygJ-lkNWtba8TQT-Px";

export async function createStonfiPoolForJetton(
    jetton: { ourWalletAddress: RawAddressString, masterAddress: RawAddressString },
    targetBalances: [Coins, Coins],
    launchAddress: RawAddressString
) {
    try {
        const router = await balancedTonClient.execute(c => c.open(DEX.v2_1.Router.create(STONFI_ROUTER_V2_1_ADDRESS)));
        const { keyPair, wallet, queryIdManager } = await chiefWalletData();
        const [depositLiquidityQID, lpBurnQID] = await Promise.all(
            [...Array(2).keys()].map(async () => await queryIdManager.getNextCached())
        );
        const dexData = (await db.getTokenLaunch(launchAddress))?.dexData;
        const pTon = pTON.v2_1.create(STONFI_PTON_V2_1_ADDRESS);

        const pool = await balancedTonClient.execute(() => router.getPool(
            { token0: jetton.masterAddress, token1: pTon.address, }
        ));
        const poolContract = await balancedTonClient.execute(c => c.open(pool));

        const fetchPoolReservesSafely = async () =>
            await balancedTonClient.execute(c => c.isContractDeployed(poolContract.address)) ?
                await balancedTonClient.execute(() => poolContract.getPoolData()) :
                { reserve0: 0n, reserve1: 0n };

        // Pool with reserves already exists, termiante
        const poolData = await fetchPoolReservesSafely();
        if (poolData.reserve0 !== 0n && poolData.reserve1 !== 0n) return;

        let iterationNumber = 1;
        while (true) {
            try {
                const { reserve0, reserve1 } = await fetchPoolReservesSafely();
                // To do all the calls inside only once
                let liquidityProvidingMessages: [SenderArguments, SenderArguments] | undefined;

                // Update stats and terminate the cycle
                if (reserve0 > 0n && reserve1 > 0n) {
                    logger().info(`[stonfi] liquidity deposit [${reserve0}, ${reserve1}] confirmed for ${jetton.masterAddress} (launch ${launchAddress}, pool ${poolContract.address})`);

                    let newDexData: DexData;
                    if (dexData) {
                        newDexData = dexData;
                        newDexData.addedLiquidity = true;
                        if (!newDexData.poolAddress) newDexData.poolAddress = poolContract.address.toRawString();
                    } else {
                        newDexData = {
                            jettonVaultAddress: "deployed to stonfi, no vault",
                            poolAddress: poolContract.address.toRawString(),
                            payedToCreator: false,
                            addedLiquidity: true,
                        };
                    }
                    await db.updateDexData(launchAddress, newDexData);
                    break;
                }
                // Pool is empty - sending the
                if (!(reserve0 || reserve1)) {
                    liquidityProvidingMessages = !liquidityProvidingMessages ? await Promise.all([
                        // deposit `targetBalances[0]` TON to the Jetton/TON pool and get at least 1 nano LP token
                        router.getProvideLiquidityTonTxParams({
                            userWalletAddress: wallet.address,
                            proxyTon: pTon,
                            sendAmount: targetBalances[0],
                            otherTokenAddress: Address.parse(jetton.masterAddress),
                            minLpOut: "1",
                        }),
                        // deposit `targetBalances[1]` Jetton to the Jetton/TON pool and get at least 1 nano LP token
                        router.getProvideLiquidityJettonTxParams({
                            userWalletAddress: wallet.address,
                            sendTokenAddress: Address.parse(jetton.masterAddress),
                            sendAmount: targetBalances[1],
                            otherTokenAddress: pTon.address,
                            minLpOut: "1",
                        }),
                    ]) : liquidityProvidingMessages;

                    await balancedTonClient.execute(() =>
                        wallet.sendBatch(keyPair.secretKey,
                            [{
                                type: "sendMsg",
                                mode: SendMode.PAY_GAS_SEPARATELY,
                                outMsg: internal_relaxed(liquidityProvidingMessages![0]),
                            }, {
                                type: "sendMsg",
                                mode: SendMode.PAY_GAS_SEPARATELY,
                                outMsg: internal_relaxed(liquidityProvidingMessages![1]),
                            }],
                            SUBWALLET_ID,
                            depositLiquidityQID,
                            DEFAULT_TIMEOUT,
                        )
                    );
                    await delay(60 + iterationNumber * 7.5);
                }
            } catch (e) {
                logger().warn(`[stonfi] failed to add liquidity for ${jetton.masterAddress} (launch ${launchAddress}, pool ${poolContract.address}) with error: `, e);
            }
            iterationNumber += 1;
            if (iterationNumber === 5) {
                logger().error(`[stonfi] failed to add liquidity for ${jetton.masterAddress} (launch ${launchAddress}, pool ${poolContract.address}) after 5 tries, wrapping up!`);
                return;
            }
        }

        const lpTokenWallet = await balancedTonClient.execute(
            () => poolContract.getJettonWallet({ ownerAddress: wallet.address })
        );
        const lpTokenWalletContract = await balancedTonClient.execute(c => c.open(lpTokenWallet));
        const lpTokenWalletData = await balancedTonClient.execute(() => lpTokenWalletContract.getWalletData());

        const lpBurn = await balancedTonClient.execute(
            () => poolContract.getBurnTxParams(
                // TODO Check twice
                { amount: lpTokenWalletData.balance, userWalletAddress: wallet.address }
            )
        );
        await balancedTonClient.execute(() =>
            wallet.sendExternalMessage(keyPair.secretKey, {
                createdAt: Math.floor((Date.now() / 1000) - 10),
                queryId: lpBurnQID,
                message: internal_relaxed(lpBurn),
                mode: SendMode.PAY_GAS_SEPARATELY,
                subwalletId: SUBWALLET_ID,
                timeout: DEFAULT_TIMEOUT
            })
        );
    } catch (e) {
        logger().error(`[stonfi] failed to create pool for jetton ${jetton.masterAddress} (launch ${launchAddress}), au revoir! `, e);
        console.error(e);
    }
}
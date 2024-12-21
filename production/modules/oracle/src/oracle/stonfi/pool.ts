import {
    type RawAddressString,
    type Coins,
    BURN_ADDR,
    Network,
} from "starton-periphery";
import { type SenderArguments, Address, SendMode } from "@ton/ton";
import { internal as internal_relaxed, toNano } from "@ton/core";
import { JettonWalletMessageBuilder } from "../messageBuilder";
import { balancedTonClient } from "../client";
import { chiefWalletData } from "../highload";
import { currentNetwork } from "../../config";
import { DEX, pTON } from "@ston-fi/sdk";
import { logger } from "../../logger";
import * as db from "../../db";
import {
    STONFI_ROUTER_V2_1_ADDRESS_MAINNET,
    STONFI_ROUTER_V2_1_ADDRESS_TESTNET,
    STONFI_PTON_V2_1_ADDRESS_MAINNET,
    STONFI_PTON_V2_1_ADDRESS_TESTNET,
    DEFAULT_TIMEOUT,
    SUBWALLET_ID,
    delay,
} from "starton-periphery";

export async function createStonfiPoolForJetton(
    jetton: { ourWalletAddress: RawAddressString, masterAddress: RawAddressString },
    targetBalances: [Coins, Coins],
    launchAddress: RawAddressString
): Promise<void> {
    try {
        const router = await balancedTonClient.execute(c =>
            c.open(DEX.v2_2.Router.create(currentNetwork() === Network.Mainnet ? STONFI_ROUTER_V2_1_ADDRESS_MAINNET : STONFI_ROUTER_V2_1_ADDRESS_TESTNET)));
        const { keyPair, wallet, queryIdManager } = await chiefWalletData();
        const [depositLiquidityQID, lpBurnQID] = await Promise.all(
            [...Array(2).keys()].map(async () => await queryIdManager.getNextCached())
        );
        const pTon = pTON.v2_1.create(currentNetwork() === Network.Mainnet ? STONFI_PTON_V2_1_ADDRESS_MAINNET : STONFI_PTON_V2_1_ADDRESS_TESTNET);

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
                    await db.updateDexData(launchAddress, {
                        poolAddress: poolContract.address.toRawString(),
                        addedLiquidity: true,
                    });
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
        const lpWalletContract = await balancedTonClient.execute(c => c.open(lpTokenWallet));
        const lpBalance = await balancedTonClient.execute(() => lpWalletContract.getBalance());

        if (!lpBalance) return;
        const lpJettonsBurnMessage = JettonWalletMessageBuilder.transferMessage(
            lpWalletContract.address, toNano("0.5"), {
                to: BURN_ADDR,
                jettonAmount: lpBalance,
                responseAddress: wallet.address,
                queryId: 0,
            });
        await balancedTonClient.execute(() =>
            wallet.sendExternalMessage(keyPair.secretKey, {
                createdAt: Math.floor((Date.now() / 1000) - 10),
                queryId: lpBurnQID,
                message: lpJettonsBurnMessage,
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
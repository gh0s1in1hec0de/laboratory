import {
    TESTNET_FACTORY_ADDR, BURN_ADDR, DEFAULT_TIMEOUT,
    SUBWALLET_ID, type RawAddressString, type Coins,
} from "starton-periphery";
import { chiefWalletData } from "../highload";
import { currentNetwork } from "../../config";
import { Address, SendMode } from "@ton/ton";
import { delay, Network } from "../../utils";
import { balancedTonClient } from "../api";
import { logger } from "../../logger";
import { toNano } from "@ton/core";
import * as db from "../../db";
import {
    JettonWalletMessageBuilder,
    NativeVaultMessageBuilder,
    FactoryMessageBuilder,
} from "./mesageBuilder";
import {
    MAINNET_FACTORY_ADDR,
    ReadinessStatus,
    JettonWallet,
    VaultJetton,
    PoolType,
    Factory,
    Asset,
} from "@dedust/sdk";

// Highest pressure point on the api - 3 requests queue
export async function createPoolForJetton(
    jetton: { ourWalletAddress: RawAddressString, masterAddress: RawAddressString },
    targetBalances: [Coins, Coins],
    launchAddress: RawAddressString
): Promise<void> {
    try {
        const queryId = Math.floor(Date.now() / 1000);
        logger().info(`[*] pool deployment process started for jetton ${jetton.masterAddress} (query id ${queryId}); god bless it...`);

        const dexData = (await db.getTokenLaunch(launchAddress))?.dexData;
        const { keyPair, wallet, queryIdManager } = await chiefWalletData();
        const [deployVaultQID, createPoolQID, depositLiquidityQID, lpBurnQID] = await Promise.all(
            [...Array(5).keys()].map(async () => await queryIdManager.getNextCached())
        );

        const asset = Asset.jetton(Address.parse(jetton.masterAddress));
        const assets: [Asset, Asset] = [Asset.native(), asset];

        const factory = await balancedTonClient.execute(
            c => c.open(
                Factory.createFromAddress(
                    currentNetwork() === Network.Mainnet ? MAINNET_FACTORY_ADDR : TESTNET_FACTORY_ADDR)
            )
        );

        // ~ 3 requests consecutively, then delays
        let vaultStatus: ReadinessStatus;
        const jettonVault = await balancedTonClient.execute(() => factory.getJettonVault(Address.parse(jetton.masterAddress)), true);
        const jettonVaultContract = await balancedTonClient.execute(c => c.open(jettonVault));

        let iterationNumber = 1;
        while (true) {
            try {
                let delayTime = 15;
                vaultStatus = await balancedTonClient.execute(() => jettonVaultContract.getReadinessStatus(), true);
                if (vaultStatus === ReadinessStatus.NOT_DEPLOYED) {
                    logger().info(`vault for jetton ${jetton.masterAddress} (launch ${launchAddress}) not found, deploying...`);
                    const message = FactoryMessageBuilder.createVaultMessage({ assets, queryId });
                    await balancedTonClient.execute(() =>
                        wallet.sendExternalMessage(keyPair.secretKey, {
                            createdAt: Date.now() / 1000,
                            queryId: deployVaultQID,
                            message,
                            mode: SendMode.PAY_GAS_SEPARATELY,
                            subwalletId: SUBWALLET_ID,
                            timeout: DEFAULT_TIMEOUT
                        })
                    );
                    delayTime = 47.5; // My soul said so
                }
                if (vaultStatus === ReadinessStatus.READY) {
                    logger().info(`vault for jetton ${jetton.masterAddress} (launch ${launchAddress}) is ready`);
                    break;
                }
                await delay(delayTime);
            } catch (e) {
                logger().warn(`failed to create vault for ${jetton.masterAddress} (launch ${launchAddress}) with error: `, e);
                await delay(20);
            }
            iterationNumber += 1;
            if (iterationNumber === 5) {
                logger().error(`failed to create vault for ${jetton.masterAddress} (launch ${launchAddress}) after 5 tries, xoxo!`);
                return;
            }
        }

        // ~ 3 requests consecutively, then delays
        let poolReadiness: ReadinessStatus;
        const pool = await balancedTonClient.execute(() => factory.getPool(PoolType.VOLATILE, assets), true);
        const poolContract = await balancedTonClient.execute(c => c.open(pool));

        iterationNumber = 1;
        while (true) {
            try {
                poolReadiness = await balancedTonClient.execute(() => poolContract.getReadinessStatus(), true);

                if (poolReadiness !== ReadinessStatus.NOT_DEPLOYED) {
                    logger().info(`pool for jetton ${jetton.masterAddress} (launch ${launchAddress}) exists, moving forward...`);
                    break;
                }
                logger().info(`pool for jetton ${jetton.masterAddress} (launch ${launchAddress}) not found, deploying...`);
                const message = FactoryMessageBuilder.createVolatilePoolMessage({ assets, queryId });
                await balancedTonClient.execute(() =>
                    wallet.sendExternalMessage(keyPair.secretKey, {
                        createdAt: Date.now() / 1000,
                        queryId: createPoolQID,
                        message,
                        mode: SendMode.PAY_GAS_SEPARATELY,
                        subwalletId: SUBWALLET_ID,
                        timeout: DEFAULT_TIMEOUT
                    })
                );
                await delay(60);
            } catch (e) {
                logger().warn(`failed to deploy pool for ${jetton.masterAddress} (launch ${launchAddress}, pool ${poolContract.address}) with error: `, e);
                await delay(20);
            }
            iterationNumber += 1;
            if (iterationNumber === 5) {
                logger().error(`failed to deploy pool for ${jetton.masterAddress} (launch ${launchAddress}, pool ${poolContract.address}) after 5 tries, mua!`);
                return;
            }
        }

        // Only one request for those 2 messages as they can be processed simultaneously
        const tonVault = await balancedTonClient.execute(() => factory.getNativeVault(), true);
        const ourJettonWallet = await balancedTonClient.execute(
            c => c.open(JettonWallet.createFromAddress(Address.parse(jetton.ourWalletAddress)))
        );
        const tonDepositMessage = NativeVaultMessageBuilder.liquidityDepositMessage(
            tonVault.address, {
                queryId, assets,
                poolType: PoolType.VOLATILE,
                targetBalances,
                amount: targetBalances[0],
            }
        );
        const jettonDepositMessage = JettonWalletMessageBuilder.transferMessage(
            ourJettonWallet.address, toNano("0.5"), {
                to: jettonVault.address,
                jettonAmount: targetBalances[1],
                queryId,
                responseAddress: wallet.address,
                forwardTonAmount: toNano("0.4"),
                forwardPayload: VaultJetton.createDepositLiquidityPayload({
                    poolType: PoolType.VOLATILE,
                    assets,
                    targetBalances,
                })
            });

        iterationNumber = 1;
        while (true) {
            try {
                const [reserve1, reserve2] = await balancedTonClient.execute(() => poolContract.getReserves(), true);
                if (reserve1 > 0n && reserve2 > 0n) {
                    logger().info(`liquidity deposit [${reserve1}, ${reserve2}] confirmed for ${jetton.masterAddress} (launch ${launchAddress}, pool ${poolContract.address})`);

                    let newDexData: db.DexData;
                    if (dexData) {
                        newDexData = dexData;
                        newDexData.addedLiquidity = true;
                        if (!newDexData.jettonVaultAddress) newDexData.jettonVaultAddress = jettonVaultContract.address.toRawString();
                        if (!newDexData.poolAddress) newDexData.poolAddress = poolContract.address.toRawString();
                    } else {
                        logger().warn("triggered unreachable, mua!");
                        newDexData = {
                            jettonVaultAddress: jettonVaultContract.address.toRawString(),
                            poolAddress: poolContract.address.toRawString(),
                            payedToCreator: false,
                            addedLiquidity: true,
                        };
                    }
                    await db.updateDexData(launchAddress, newDexData);
                    break;
                }
                if (!(reserve1 || reserve2)) {
                    logger().info(`liquidity for ${jetton.masterAddress} (launch ${launchAddress}, pool ${poolContract.address}) not found, sending...`);
                    await balancedTonClient.execute(() =>
                        wallet.sendBatch(keyPair.secretKey,
                            [{
                                type: "sendMsg",
                                mode: SendMode.PAY_GAS_SEPARATELY,
                                outMsg: tonDepositMessage,
                            }, {
                                type: "sendMsg",
                                mode: SendMode.PAY_GAS_SEPARATELY,
                                outMsg: jettonDepositMessage,
                            }],
                            SUBWALLET_ID,
                            depositLiquidityQID,
                            DEFAULT_TIMEOUT,
                        )
                    );
                    await delay(60 + iterationNumber * 7.5);
                }
            } catch (e) {
                logger().warn(`failed to add liquidity for ${jetton.masterAddress} (launch ${launchAddress}, pool ${poolContract.address}) with error: `, e);
            }
            iterationNumber += 1;
            if (iterationNumber === 5) {
                logger().error(`failed to add liquidity for ${jetton.masterAddress} (launch ${launchAddress}, pool ${poolContract.address}) after 5 tries, wrapping up!`);
                return;
            }
        }

        // ~ 3 requests consecutively, then delays
        const lpWallet = await balancedTonClient.execute(() => poolContract.getWallet(wallet.address), true);
        const lpWalletContract = await balancedTonClient.execute(c => c.open(lpWallet));
        const lpBalance = await balancedTonClient.execute(() => lpWalletContract.getBalance(), true);

        if (!lpBalance) return;
        const lpJettonsBurnMessage = JettonWalletMessageBuilder.transferMessage(ourJettonWallet.address, toNano("0.5"), {
            to: BURN_ADDR,
            jettonAmount: lpBalance,
            responseAddress: wallet.address,
            queryId,
        });
        await balancedTonClient.execute(() =>
            wallet.sendExternalMessage(keyPair.secretKey, {
                createdAt: Date.now() / 1000,
                queryId: lpBurnQID,
                message: lpJettonsBurnMessage,
                mode: SendMode.PAY_GAS_SEPARATELY,
                subwalletId: SUBWALLET_ID,
                timeout: DEFAULT_TIMEOUT
            })
        );
    } catch (e) {
        logger().error(`failed to create pool for jetton ${jetton.masterAddress} (launch ${launchAddress}), au revoir! `, e);
    }
}

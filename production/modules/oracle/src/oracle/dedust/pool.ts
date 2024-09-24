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
        const queryId = Date.now();
        logger().info(`pool deployment process started for jetton ${jetton.masterAddress} (query id ${queryId}); god bless it...`);

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

        while (true) {
            vaultStatus = await balancedTonClient.execute(() => jettonVaultContract.getReadinessStatus(), true);
            let delayTime = 15;
            if (vaultStatus === ReadinessStatus.NOT_DEPLOYED) {
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
                delayTime = 60;
            }
            // Ask Anastasia about vault statuses
            if (vaultStatus === ReadinessStatus.READY) break;
            await delay(delayTime);
        }

        // ~ 3 requests consecutively, then delays
        let poolReadiness: ReadinessStatus;
        const pool = await balancedTonClient.execute(() => factory.getPool(PoolType.VOLATILE, assets), true);
        const poolContract = await balancedTonClient.execute(c => c.open(pool));

        while (true) {
            poolReadiness = await balancedTonClient.execute(() => poolContract.getReadinessStatus(), true);

            if (poolReadiness !== ReadinessStatus.NOT_DEPLOYED) break;
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

        let iterationNumber = 0;
        let liquidityWasProvided = false;
        while (!liquidityWasProvided) {
            iterationNumber += 1;
            await delay(15 + iterationNumber * 3.5);

            const [reserve1, reserve2] = await balancedTonClient.execute(() => poolContract.getReserves(), true);
            if (reserve1 > 0n && reserve2 > 0n) {
                logger().info(`liquidity deposit [${reserve1}, ${reserve2}] confirmed for ${jetton.masterAddress} (pool: ${poolContract.address})`);

                let newDexData: db.DexData;
                if (dexData) {
                    newDexData = dexData;
                    newDexData.addedLiquidity = true;
                    if (!newDexData.jettonVaultAddress) newDexData.jettonVaultAddress = jettonVaultContract.address.toRawString();
                    if (!newDexData.poolAddress) newDexData.poolAddress = poolContract.address.toRawString();
                } else { // Theoretically, it is unreachable code
                    newDexData = {
                        jettonVaultAddress: jettonVaultContract.address.toRawString(),
                        poolAddress: poolContract.address.toRawString(),
                        payedToCreator: false,
                        addedLiquidity: true,
                    };
                }
                await db.updateDexData(launchAddress, newDexData);
                liquidityWasProvided = true;
            }
            if (iterationNumber > 10) logger().warn(`problems with liquidity deposit for for ${jetton.masterAddress} (pool: ${poolContract.address})`);
            else logger().info(`awaiting liquidity deposit for ${jetton.masterAddress} (pool: ${poolContract.address})`);
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
        logger().error(`failed to create pool for jetton ${jetton.masterAddress}, au revoir! `, e);
    }
}

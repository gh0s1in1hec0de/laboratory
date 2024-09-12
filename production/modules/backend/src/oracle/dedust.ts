import { TESTNET_FACTORY_ADDR, type RawAddressString, type Coins, BURN_ADDR } from "starton-periphery";
import { getChiefWalletContract } from "./walletInteractions.ts";
import { currentNetwork } from "../config.ts";
import { balancedTonClient } from "./api.ts";
import { delay, Network } from "../utils.ts";
import { logger } from "../logger.ts";
import { Address } from "@ton/ton";
import { toNano } from "@ton/core";
import {
    MAINNET_FACTORY_ADDR,
    ReadinessStatus,
    JettonWallet,
    VaultJetton,
    PoolType,
    Factory,
    Asset,
} from "@dedust/sdk";

export async function createPoolForJetton(
    jetton: { ourWalletAddress: RawAddressString, masterAddress: RawAddressString },
    targetBalances: [Coins, Coins],
): Promise<void> {
    try {
        const queryId = Date.now();
        logger().info(`pool deployment process started for jetton ${jetton.masterAddress} (query id ${queryId}); god bless it...`);

        const { chiefKeyPair, chiefWalletContract } = await getChiefWalletContract();
        const sender = chiefWalletContract.sender(chiefKeyPair.secretKey);
        const asset = Asset.jetton(Address.parse(jetton.masterAddress));
        const assets: [Asset, Asset] = [Asset.native(), asset];

        const factory = await balancedTonClient.execute(
            c => c.open(
                Factory.createFromAddress(
                    currentNetwork() === Network.Mainnet ? MAINNET_FACTORY_ADDR : TESTNET_FACTORY_ADDR)
            )
        );

        let vaultIsReady = false;
        let vaultStatus: ReadinessStatus;
        const jettonVault = await balancedTonClient.execute(() => factory.getJettonVault(Address.parse(jetton.masterAddress)));
        const derivedJettonVaultContract = await balancedTonClient.execute(c => c.open(jettonVault));

        while (!vaultIsReady) {
            vaultStatus = await balancedTonClient.execute(() => derivedJettonVaultContract.getReadinessStatus());
            switch (vaultStatus) {
                case ReadinessStatus.NOT_DEPLOYED: {
                    await balancedTonClient.execute(
                        () => factory.sendCreateVault(sender, { queryId, asset })
                    );
                    await delay(30);
                    break;
                }
                case ReadinessStatus.NOT_READY: {
                    await delay(15);
                    break;
                }
                case ReadinessStatus.READY: {
                    vaultIsReady = true;
                    break;
                }
            }
        }

        let poolIsReady = false;
        let poolReadiness: ReadinessStatus;
        const pool = await balancedTonClient.execute(() => factory.getPool(PoolType.VOLATILE, assets));
        const poolContract = await balancedTonClient.execute(c => c.open(pool));

        while (!poolIsReady) {
            poolReadiness = await balancedTonClient.execute(() => poolContract.getReadinessStatus());
            switch (poolReadiness) {
                case ReadinessStatus.NOT_DEPLOYED: {
                    await balancedTonClient.execute(
                        () => factory.sendCreateVolatilePool(sender, { assets })
                    );
                    await delay(30);
                    break;
                }
                // Ironically, right?
                case ReadinessStatus.NOT_READY: {
                    poolIsReady = true;
                    await delay(15);
                    break;
                }
                default:
                    break;
            }
        }

        const tonVault = await balancedTonClient.execute(() => factory.getNativeVault());
        const tonVaultContract = await balancedTonClient.execute(c => c.open(tonVault));
        await balancedTonClient.execute(() =>
            tonVaultContract.sendDepositLiquidity(sender, {
                queryId, assets,
                poolType: PoolType.VOLATILE,
                targetBalances,
                amount: targetBalances[0],
            })
        );

        const ourJettonWallet = await balancedTonClient.execute(
            c => c.open(JettonWallet.createFromAddress(Address.parse(jetton.ourWalletAddress)))
        );
        await balancedTonClient.execute(() =>
            ourJettonWallet.sendTransfer(
                sender, toNano("0.5"), {
                    queryId,
                    destination: jettonVault.address,
                    amount: targetBalances[1],
                    responseAddress: chiefWalletContract.address,
                    forwardAmount: toNano("0.4"),
                    forwardPayload: VaultJetton.createDepositLiquidityPayload({
                        poolType: PoolType.VOLATILE,
                        assets,
                        targetBalances,
                    })
                }
            )
        );

        let iterationNumber = 0;
        let liquidityWasProvided = false;
        while (!liquidityWasProvided) {
            iterationNumber += 1;
            await delay(15 + iterationNumber * 3.5);

            const [reserve1, reserve2] = await balancedTonClient.execute(() => poolContract.getReserves());
            if (reserve1 > 0n && reserve2 > 0n) {
                logger().info(`liquidity deposit [${reserve1}, ${reserve2}] confirmed for ${jetton.masterAddress} (pool: ${poolContract.address})`);
                liquidityWasProvided = true;
            }
            if (iterationNumber > 10) logger().warn(`problems with liquidity deposit for for ${jetton.masterAddress} (pool: ${poolContract.address})`);
            else logger().info(`awaiting liquidity deposit for ${jetton.masterAddress} (pool: ${poolContract.address})`);
        }

        const lpWallet = await balancedTonClient.execute(() => poolContract.getWallet(chiefWalletContract.address));
        const lpWalletContract = await balancedTonClient.execute(c => c.open(lpWallet));
        const lpBalance = await balancedTonClient.execute(() => lpWalletContract.getBalance());
        await balancedTonClient.execute(() => {
            lpWalletContract.sendTransfer(sender, toNano("0.5"), {
                queryId,
                destination: BURN_ADDR,
                amount: lpBalance,
                responseAddress: chiefWalletContract.address
            });
        });
    } catch (e) {
        logger().error(`failed to create pool for jetton ${jetton.masterAddress}, au revoir! `, e);
    }
}

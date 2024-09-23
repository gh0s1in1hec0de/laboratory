import { internal as internal_relaxed, beginCell, toNano, type MessageRelaxed, Cell } from "@ton/core";
import { Asset, Factory, MAINNET_FACTORY_ADDR, type PoolType, VaultNative } from "@dedust/sdk";
import { type Coins, JettonOps, TESTNET_FACTORY_ADDR } from "starton-periphery";
import { currentNetwork } from "../../config";
import type { Address } from "@ton/ton";
import { Network } from "../../utils";

const factoryAddress = currentNetwork() === Network.Mainnet ? MAINNET_FACTORY_ADDR : TESTNET_FACTORY_ADDR;

export abstract class FactoryMessageBuilder {
    static createVaultMessage(params: { queryId?: number | bigint, assets: [Asset, Asset] }): MessageRelaxed {
        const { queryId, assets } = params;
        return internal_relaxed({
            to: factoryAddress,
            body: beginCell()
                .storeUint(Factory.CREATE_VOLATILE_POOL, 32)
                .storeUint(queryId ?? 0, 64)
                .storeSlice(assets[0].toSlice())
                .storeSlice(assets[1].toSlice())
                .endCell(),
            value: toNano("0.25"),
        });
    }

    static createVolatilePoolMessage(params: { queryId?: number | bigint, assets: [Asset, Asset] }): MessageRelaxed {
        const { queryId, assets } = params;
        return internal_relaxed({
            to: factoryAddress,
            body: beginCell()
                .storeUint(Factory.CREATE_VOLATILE_POOL, 32)
                .storeUint(queryId ?? 0, 64)
                .storeSlice(assets[0].toSlice())
                .storeSlice(assets[1].toSlice())
                .endCell(),
            value: toNano("0.25"),
        });
    }
}

export abstract class NativeVaultMessageBuilder {
    static liquidityDepositMessage(
        vaultAddress: Address,
        params: {
            queryId?: bigint | number,
            amount: Coins,
            poolType: PoolType,
            assets: [Asset, Asset],
            minimalLPAmount?: bigint,
            targetBalances: [bigint, bigint],
            fulfillPayload?: Cell | null,
            rejectPayload?: Cell | null,
        }): MessageRelaxed {
        const {
            queryId, amount, poolType, assets, minimalLPAmount,
            targetBalances, fulfillPayload, rejectPayload,
        } = params;
        return internal_relaxed({
            to: vaultAddress,
            body: beginCell()
                .storeUint(VaultNative.DEPOSIT_LIQUIDITY, 32)
                .storeUint(queryId ?? 0, 64)
                .storeCoins(amount)
                .storeUint(poolType, 1)
                .storeSlice(assets[0].toSlice())
                .storeSlice(assets[1].toSlice())
                .storeRef(
                    beginCell()
                        .storeCoins(minimalLPAmount ?? 0)
                        .storeCoins(targetBalances[0])
                        .storeCoins(targetBalances[1])
                        .endCell(),
                )
                .storeMaybeRef(fulfillPayload)
                .storeMaybeRef(rejectPayload)
                .endCell(),
            value: amount + toNano("0.15"),
        });
    }
}

export abstract class JettonWalletMessageBuilder {
    static transferMessage(
        ourJettonWalletAddress: Address,
        value: Coins,
        params: {
            to: Address,
            jettonAmount: bigint,
            responseAddress: Address | null,
            queryId?: number | bigint,
            customPayload?: Cell,
            forwardTonAmount?: bigint,
            forwardPayload?: Cell | null,
        }
    ) {
        const { to, jettonAmount, responseAddress, queryId, customPayload, forwardTonAmount, forwardPayload } = params;
        return internal_relaxed({
            to: ourJettonWalletAddress,
            body: beginCell().storeUint(JettonOps.Transfer, 32).storeUint(queryId ?? 0, 64)
                .storeCoins(jettonAmount)
                .storeAddress(to)
                .storeAddress(responseAddress)
                .storeMaybeRef(customPayload)
                .storeCoins(forwardTonAmount ?? 0)
                .storeMaybeRef(forwardPayload)
                .endCell(),
            value,
        });
    }
}


import { internal as internal_relaxed } from "@ton/core/dist/types/_helpers";
import { type Coins, JettonOps } from "starton-periphery";
import { beginCell, Cell } from "@ton/core";
import type { Address } from "@ton/ton";

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
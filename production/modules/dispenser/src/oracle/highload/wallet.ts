import { CachedHighloadQueryIdManager } from "./CachedHighloadQueryIdManager";
import { type KeyPair, mnemonicToWalletKey } from "@ton/crypto";
import { Address, type OpenedContract } from "@ton/ton";
import { HighloadWalletV3 } from "starton-periphery";
import { balancedTonClient } from "../../client";
import { getConfig } from "../../config";

let keyPair: KeyPair | null = null;
let wallet: OpenedContract<HighloadWalletV3> | null = null;
let queryIdManager: CachedHighloadQueryIdManager | null;

export async function walletData(): Promise<{
    keyPair: KeyPair,
    wallet: OpenedContract<HighloadWalletV3>,
    queryIdManager: CachedHighloadQueryIdManager,
}> {
    if (!keyPair) keyPair = await mnemonicToWalletKey(getConfig().ton.wallet.mnemonic.split(" "));
    if (!wallet) {
        wallet = await balancedTonClient.execute(c =>
            c.open(HighloadWalletV3.createFromAddress(Address.parse(getConfig().ton.wallet.address)))
        );
    }
    if (!queryIdManager) queryIdManager = await CachedHighloadQueryIdManager.fromAddress(Address.parse(getConfig().ton.wallet.address).toRawString());
    return { keyPair, wallet, queryIdManager };
}
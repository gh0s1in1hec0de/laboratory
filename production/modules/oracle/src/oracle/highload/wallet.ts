import { CachedHighloadQueryIdManager } from "./CachedHighloadQueryIdManager";
import { type KeyPair, mnemonicToWalletKey } from "@ton/crypto";
import { Address, type OpenedContract } from "@ton/ton";
import { HighloadWalletV3 } from "starton-periphery";
import { balancedTonClient } from "../api";
import { chief } from "../../config";


let keyPair: KeyPair | null = null;
let wallet: OpenedContract<HighloadWalletV3> | null = null;
let queryIdManager: CachedHighloadQueryIdManager | null;

export async function chiefWalletData(): Promise<{
    keyPair: KeyPair,
    wallet: OpenedContract<HighloadWalletV3>,
    queryIdManager: CachedHighloadQueryIdManager,
}> {
    if (!keyPair) keyPair = await mnemonicToWalletKey(chief().mnemonic.split(" "));
    if (!wallet) {
        wallet = await balancedTonClient.execute(c =>
            c.open(HighloadWalletV3.createFromAddress(Address.parse(chief().address)))
        );
    }
    if (!queryIdManager) queryIdManager = await CachedHighloadQueryIdManager.fromAddress(Address.parse(chief().address).toRawString());
    return { keyPair, wallet, queryIdManager };
}
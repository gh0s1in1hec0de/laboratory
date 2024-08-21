import { Address, Cell, Contract, ContractProvider } from "@ton/core";
import { Coins } from "starton-periphery";

// TODO Maybe merge VaultData with storage?
export type VaultData = {
    owner: Address,
    wlTonBalance: Coins,
    publicTonBalance: Coins,
    jettonBalance: Coins,
}

export class TokenLaunch implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new TokenLaunch(address);
    }

    async getVaultData(provider: ContractProvider): Promise<VaultData> {
        let { stack } = await provider.get("get_vault_data", []);
        return {
            owner: stack.readAddress(),
            wlTonBalance: stack.readBigNumber(),
            publicTonBalance: stack.readBigNumber(),
            jettonBalance: stack.readBigNumber(),
        };
    }
}
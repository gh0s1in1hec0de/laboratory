import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider } from "@ton/core";
import { BASECHAIN, Coins } from "starton-periphery";
import { CoinsMaxValue } from "./utils";

export type VaultState = {
    owner: Address,
    tokenLaunch: Address,
    wlTonBalance?: Coins,
    publicTonBalance?: Coins,
    jettonBalance?: Coins,
}

export class UserVaultV1 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new UserVaultV1(address);
    }

    static createFromState(state: { owner: Address, tokenLaunch: Address }, code: Cell, workchain = BASECHAIN) {
        const data = this.buildState(state);
        const init = { code, data };
        return new UserVaultV1(contractAddress(workchain, init), init);
    }

    async getVaultData(provider: ContractProvider): Promise<VaultState> {
        let { stack } = await provider.get("get_vault_data", []);
        return {
            owner: stack.readAddress(),
            tokenLaunch: stack.readAddress(),
            wlTonBalance: stack.readBigNumber(),
            publicTonBalance: stack.readBigNumber(),
            jettonBalance: stack.readBigNumber(),
        };
    }

    static buildState({
        owner,
        tokenLaunch,
        wlTonBalance,
        publicTonBalance,
        jettonBalance
    }: VaultState, loadAtMax: boolean = false): Cell {
        return beginCell()
            .storeAddress(owner)
            .storeAddress(tokenLaunch)
            .storeCoins(loadAtMax ? CoinsMaxValue : wlTonBalance ?? 0)
            .storeCoins(loadAtMax ? CoinsMaxValue : publicTonBalance ?? 0)
            .storeCoins(loadAtMax ? CoinsMaxValue : jettonBalance ?? 0)
            .endCell();
    }
}
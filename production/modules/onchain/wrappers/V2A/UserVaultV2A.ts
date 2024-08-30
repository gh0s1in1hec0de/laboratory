import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider } from "@ton/core";
import { BASECHAIN, Coins, FALSE, TRUE } from "starton-periphery";
import { CoinsMaxValue } from "../utils";

export type VaultState = {
    owner: Address,
    tokenLaunch: Address,
    hasWhitelist?: boolean,
    wlTonBalance?: Coins,
    publicTonBalance?: Coins,
    jettonBalance?: Coins,
}

export class UserVaultV2A implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new UserVaultV2A(address);
    }

    static createFromState(state: { owner: Address, tokenLaunch: Address }, code: Cell, workchain = BASECHAIN) {
        const data = this.buildState(state);
        const init = { code, data };
        return new UserVaultV2A(contractAddress(workchain, init), init);
    }

    async getVaultData(provider: ContractProvider): Promise<VaultState> {
        let { stack } = await provider.get("get_vault_data", []);
        return {
            owner: stack.readAddress(),
            tokenLaunch: stack.readAddress(),
            hasWhitelist: stack.readBoolean(),
            wlTonBalance: stack.readBigNumber(),
            publicTonBalance: stack.readBigNumber(),
            jettonBalance: stack.readBigNumber(),
        };
    }

    static buildState({
        owner,
        tokenLaunch,
        hasWhitelist,
        wlTonBalance,
        publicTonBalance,
        jettonBalance
    }: VaultState, loadAtMax: boolean = false): Cell {
        return beginCell()
            .storeAddress(owner)
            .storeAddress(tokenLaunch)
            .storeInt(hasWhitelist === undefined ? FALSE : (hasWhitelist ? TRUE : FALSE), 1)
            .storeCoins(loadAtMax ? CoinsMaxValue : wlTonBalance ?? 0)
            .storeCoins(loadAtMax ? CoinsMaxValue : publicTonBalance ?? 0)
            .storeCoins(loadAtMax ? CoinsMaxValue : jettonBalance ?? 0)
            .endCell();
    }
}
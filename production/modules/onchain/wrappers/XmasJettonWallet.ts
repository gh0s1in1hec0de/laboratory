import { JettonOps } from "./JettonConstants";
import { endParse } from "starton-periphery";
import {
    Address, Cell, Contract, beginCell,
    ContractProvider, contractAddress,
    Sender, SendMode, toNano
} from "@ton/core";

export type JettonWalletConfig = {
    ownerAddress: Address,
    jettonMasterAddress: Address
};

export function jettonWalletConfigToCell(config: JettonWalletConfig): Cell {
    return beginCell()
        .storeCoins(0) // jetton balance
        .storeAddress(config.ownerAddress)
        .storeAddress(config.jettonMasterAddress)
        .endCell();
}

// Unchanged from standard JettonWallet, just avoiding naming mess
export class XmasJettonWallet implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new XmasJettonWallet(address);
    }

    static createFromConfig(config: JettonWalletConfig, code: Cell, workchain = 0) {
        const data = jettonWalletConfigToCell(config);
        const init = { code, data };
        return new XmasJettonWallet(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getWalletData(provider: ContractProvider) {
        let { stack } = await provider.get("get_wallet_data", []);
        return {
            balance: stack.readBigNumber(),
            owner: stack.readAddress(),
            minter: stack.readAddress(),
            wallet_code: stack.readCell()
        };
    }

    async getJettonBalance(provider: ContractProvider) {
        let state = await provider.getState();
        if (state.state.type !== "active") {
            return 0n;
        }
        let res = await provider.get("get_wallet_data", []);
        return res.stack.readBigNumber();
    }

    async getWalletStatus(provider: ContractProvider) {
        let state = await provider.getState();
        if (state.state.type !== "active") {
            return 0;
        }
        let res = await provider.get("get_status", []);
        return res.stack.readNumber();
    }

    static transferMessage(jetton_amount: bigint, to: Address,
        responseAddress: Address | null,
        customPayload: Cell | null,
        forward_ton_amount: bigint,
        forwardPayload: Cell | null) {

        return beginCell().storeUint(JettonOps.Transfer, 32).storeUint(0, 64) // op, queryId
            .storeCoins(jetton_amount) // 124
            .storeAddress(to) // ~267
            .storeAddress(responseAddress) // ~267
            .storeMaybeRef(customPayload) // 0
            .storeCoins(forward_ton_amount) // 124
            .storeMaybeRef(forwardPayload) // 0
            .endCell();
    }

    async sendTransfer(provider: ContractProvider, via: Sender,
        value: bigint,
        jetton_amount: bigint, to: Address,
        responseAddress: Address,
        customPayload: Cell | null,
        forward_ton_amount: bigint,
        forwardPayload: Cell | null) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: XmasJettonWallet.transferMessage(jetton_amount, to, responseAddress, customPayload, forward_ton_amount, forwardPayload),
            value: value
        });

    }

    /*
      burn#595f07bc query_id:uint64 amount:(VarUInteger 16)
                    response_destination:MsgAddress custom_payload:(Maybe ^Cell)
                    = InternalMsgBody;
    */
    static burnMessage(jetton_amount: bigint,
        responseAddress: Address | null,
        customPayload: Cell | null) {
        return beginCell()
            .storeUint(JettonOps.Burn, 32)
            .storeUint(0, 64) // op, queryId
            .storeCoins(jetton_amount)
            .storeAddress(responseAddress)
            .storeMaybeRef(customPayload)
            .endCell();
    }

    async sendBurn(provider: ContractProvider, via: Sender, value: bigint,
        jetton_amount: bigint,
        responseAddress: Address | null,
        customPayload: Cell | null) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: XmasJettonWallet.burnMessage(jetton_amount, responseAddress, customPayload),
            value: value
        });

    }

    /*
      withdraw_tons#107c49ef query_id:uint64 = InternalMsgBody;
    */
    static withdrawTonsMessage() {
        return beginCell().storeUint(0x6d8e5e3c, 32).storeUint(0, 64) // op, queryId
            .endCell();
    }

    async sendWithdrawTons(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: XmasJettonWallet.withdrawTonsMessage(),
            value: toNano("0.1")
        });

    }

    /*
      withdraw_jettons#10 query_id:uint64 wallet:MsgAddressInt amount:Coins = InternalMsgBody;
    */
    static withdrawJettonsMessage(from: Address, amount: bigint) {
        return beginCell().storeUint(0x768a50b2, 32).storeUint(0, 64) // op, queryId
            .storeAddress(from)
            .storeCoins(amount)
            .storeMaybeRef(null)
            .endCell();
    }

    async sendWithdrawJettons(provider: ContractProvider, via: Sender, from: Address, amount: bigint) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: XmasJettonWallet.withdrawJettonsMessage(from, amount),
            value: toNano("0.1")
        });

    }
}

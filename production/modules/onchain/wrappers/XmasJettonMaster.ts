import {
    tokenMetadataToCell,
    endParse,
    OnchainMetadataStandard,
    TokensLaunchOps,
    OP_LENGTH,
    QUERY_ID_LENGTH, jettonToNano, Coins
} from "starton-periphery";
import { JettonWallet } from "./JettonWallet";
import { JettonOps } from "./JettonConstants";
import {
    ContractProvider,
    contractAddress,
    beginCell,
    Contract,
    SendMode,
    Address,
    toNano,
    Sender,
    Slice,
    Cell,
} from "@ton/core";
import { SendMessageParams } from "./utils";
import { randomAddress } from "@ton/test-utils";

export type JettonMasterConfig = {
    supply: bigint,
    admin: Address,
    walletCode: Cell,
    jettonContent: Cell | OnchainMetadataStandard
};

export function jettonMasterConfigCellToConfig(config: Cell): JettonMasterConfig {
    const sc = config.beginParse();
    const parsed: JettonMasterConfig = {
        supply: sc.loadCoins(),
        admin: sc.loadAddress(),
        walletCode: sc.loadRef(),
        jettonContent: sc.loadRef()
    };
    endParse(sc);
    return parsed;
}

export function parseJettonMasterData(data: Cell): JettonMasterConfig {
    return jettonMasterConfigCellToConfig(data);
}

export function jettonMasterConfigToCell(config: JettonMasterConfig): Cell {
    const content = config.jettonContent instanceof Cell ? config.jettonContent : tokenMetadataToCell(config.jettonContent);
    return beginCell()
        .storeCoins(0)
        .storeAddress(config.admin)
        .storeRef(config.walletCode)
        .storeRef(content)
        .endCell();
}

// Unchanged from standard JettonMaster, just avoiding naming mess
export class XmasJettonMaster implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new XmasJettonMaster(address);
    }

    static createFromConfig(config: JettonMasterConfig, code: Cell, workchain = 0) {
        const data = jettonMasterConfigToCell(config);
        const init = { code, data };
        return new XmasJettonMaster(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(JettonOps.TopUp, 32).storeUint(0, 64).endCell(),
        });
    }

    static mintMessage(to: Address, jetton_amount: bigint, from?: Address | null, response?: Address | null, customPayload?: Cell | null, forward_ton_amount: bigint = 0n, total_ton_amount: bigint = 0n) {
        const mintMsg = beginCell().storeUint(JettonOps.InternalTransfer, 32)
            .storeUint(0, 64)
            .storeCoins(jetton_amount)
            .storeAddress(from)
            .storeAddress(response)
            .storeCoins(forward_ton_amount)
            .storeMaybeRef(customPayload)
            .endCell();
        return beginCell().storeUint(JettonOps.Mint, 32).storeUint(0, 64) // op, queryId
            .storeAddress(to)
            .storeCoins(total_ton_amount)
            .storeRef(mintMsg)
            .endCell();
    }

    static parseMintInternalMessage(slice: Slice) {
        const op = slice.loadUint(32);
        if (op !== JettonOps.InternalTransfer) throw new Error("Invalid op");
        const queryId = slice.loadUint(64);
        const jettonAmount = slice.loadCoins();
        const fromAddress = slice.loadAddress();
        const responseAddress = slice.loadAddress();
        const forwardTonAmount = slice.loadCoins();
        const customPayload = slice.loadMaybeRef();
        endParse(slice);
        return {
            queryId,
            jettonAmount,
            fromAddress,
            responseAddress,
            forwardTonAmount,
            customPayload
        };
    }

    static parseMintMessage(slice: Slice) {
        const op = slice.loadUint(32);
        if (op !== JettonOps.Mint) throw new Error("Invalid op");
        const queryId = slice.loadUint(64);
        const toAddress = slice.loadAddress();
        const tonAmount = slice.loadCoins();
        const mintMsg = slice.loadRef();
        endParse(slice);
        return {
            queryId,
            toAddress,
            tonAmount,
            internalMessage: this.parseMintInternalMessage(mintMsg.beginParse())
        };
    }

    async sendMint(provider: ContractProvider,
        via: Sender,
        to: Address,
        jetton_amount: bigint,
        from?: Address | null,
        response_addr?: Address | null,
        customPayload?: Cell | null,
        forward_ton_amount: bigint = toNano("0.05"),
        total_ton_amount: bigint = toNano("2")
    ) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: XmasJettonMaster.mintMessage(to, jetton_amount, from, response_addr, customPayload, forward_ton_amount, total_ton_amount / 2n),
            value: total_ton_amount,
        });
    }

    // Only for testing purposes
    async sendIncreaseSupply(
        provider: ContractProvider,
        sendMessageParams: SendMessageParams,
        walletOwner: Address = randomAddress(),
        amount: Coins = jettonToNano("100"),
    ) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(JettonOps.IncreaseSupply, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeAddress(walletOwner)
            .storeCoins(amount)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    /* provide_wallet_address#2c76b973 query_id:uint64 owner_address:MsgAddress include_address:Bool = InternalMsgBody;
    */
    static discoveryMessage(owner: Address, include_address: boolean) {
        return beginCell().storeUint(JettonOps.ProvideWalletAddress, 32).storeUint(0, 64) // op, queryId
            .storeAddress(owner).storeBit(include_address)
            .endCell();
    }

    async sendDiscovery(provider: ContractProvider, via: Sender, owner: Address, include_address: boolean, value: bigint = toNano("0.1")) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: XmasJettonMaster.discoveryMessage(owner, include_address),
            value: value,
        });
    }

    static topUpMessage() {
        return beginCell().storeUint(JettonOps.TopUp, 32).storeUint(0, 64) // op, queryId
            .endCell();
    }

    static parseTopUp(slice: Slice) {
        const op = slice.loadUint(32);
        if (op !== JettonOps.TopUp) throw new Error("Invalid op");
        const queryId = slice.loadUint(64);
        endParse(slice);
        return {
            queryId,
        };
    }

    async sendTopUp(provider: ContractProvider, via: Sender, value: bigint = toNano("0.1")) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: XmasJettonMaster.topUpMessage(),
            value: value,
        });
    }

    static changeAdminMessage(newOwner: Address) {
        return beginCell().storeUint(JettonOps.ChangeAdmin, 32).storeUint(0, 64) // op, queryId
            .storeAddress(newOwner)
            .endCell();
    }

    static parseChangeAdmin(slice: Slice) {
        const op = slice.loadUint(32);
        if (op !== JettonOps.ChangeAdmin) throw new Error("Invalid op");
        const queryId = slice.loadUint(64);
        const newAdminAddress = slice.loadAddress();
        endParse(slice);
        return {
            queryId,
            newAdminAddress
        };
    }

    async sendChangeAdmin(provider: ContractProvider, via: Sender, newOwner: Address) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: XmasJettonMaster.changeAdminMessage(newOwner),
            value: toNano("0.1"),
        });
    }

    static changeContentMessage(content: Cell | OnchainMetadataStandard) {
        const contentString = content instanceof Cell ? content.beginParse().loadStringTail() : content.uri;
        return beginCell().storeUint(JettonOps.ChangeMetadataUrl, 32).storeUint(0, 64) // op, queryId
            .storeStringTail(contentString)
            .endCell();
    }

    static parseChangeContent(slice: Slice) {
        const op = slice.loadUint(32);
        if (op !== JettonOps.ChangeMetadataUrl) throw new Error("Invalid op");
        const queryId = slice.loadUint(64);
        const newMetadataUrl = slice.loadStringTail();
        endParse(slice);
        return {
            queryId,
            newMetadataUrl
        };
    }

    async sendChangeContent(provider: ContractProvider, via: Sender, content: Cell | OnchainMetadataStandard) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: XmasJettonMaster.changeContentMessage(content),
            value: toNano("0.1"),
        });
    }

    static lockWalletMessage(lock_address: Address, lock: number, amount: bigint, query_id: bigint | number = 0) {
        return beginCell().storeUint(JettonOps.CallTo, 32).storeUint(query_id, 64)
            .storeAddress(lock_address)
            .storeCoins(amount)
            .storeRef(beginCell().storeUint(JettonOps.SetStatus, 32).storeUint(query_id, 64).storeUint(lock, 4).endCell())
            .endCell();
    }

    static parseSetStatus(slice: Slice) {
        const op = slice.loadUint(32);
        if (op !== JettonOps.SetStatus) throw new Error("Invalid op");
        const queryId = slice.loadUint(64);
        const newStatus = slice.loadUint(4);
        endParse(slice);
        return {
            queryId,
            newStatus
        };
    }

    static parseCallTo(slice: Slice, refPrser: (slice: Slice) => any) {
        const op = slice.loadUint(32);
        if (op !== JettonOps.CallTo) throw new Error("Invalid op");
        const queryId = slice.loadUint(64);
        const toAddress = slice.loadAddress();
        const tonAmount = slice.loadCoins();
        const ref = slice.loadRef();
        endParse(slice);
        return {
            queryId,
            toAddress,
            tonAmount,
            action: refPrser(ref.beginParse())
        };
    }

    static forceTransferMessage(transfer_amount: bigint,
        to: Address,
        from: Address,
        custom_payload: Cell | null,
        forward_amount: bigint = 0n,
        forward_payload: Cell | null,
        value: bigint = toNano("0.1"),
        query_id: bigint = 0n) {

        const transferMessage = JettonWallet.transferMessage(transfer_amount,
            to,
            to,
            custom_payload,
            forward_amount,
            forward_payload);
        return beginCell().storeUint(JettonOps.CallTo, 32).storeUint(query_id, 64)
            .storeAddress(from)
            .storeCoins(value)
            .storeRef(transferMessage)
            .endCell();
    }

    static parseTransfer(slice: Slice) {
        const op = slice.loadUint(32);
        if (op !== JettonOps.Transfer) throw new Error("Invalid op");
        const queryId = slice.loadUint(64);
        const jettonAmount = slice.loadCoins();
        const toAddress = slice.loadAddress();
        const responseAddress = slice.loadAddress();
        const customPayload = slice.loadMaybeRef();
        const forwardTonAmount = slice.loadCoins();
        const inRef = slice.loadBit();
        const forwardPayload = inRef ? slice.loadRef().beginParse() : slice;
        return {
            queryId,
            jettonAmount,
            toAddress,
            responseAddress,
            customPayload,
            forwardTonAmount,
            forwardPayload
        };
    }

    async sendForceTransfer(provider: ContractProvider,
        via: Sender,
        transfer_amount: bigint,
        to: Address,
        from: Address,
        custom_payload: Cell | null,
        forward_amount: bigint = 0n,
        forward_payload: Cell | null,
        value: bigint = toNano("0.1"),
        query_id: bigint = 0n) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: XmasJettonMaster.forceTransferMessage(transfer_amount,
                to, from,
                custom_payload,
                forward_amount,
                forward_payload,
                value, query_id),
            value: value + toNano("0.1")
        });
    }

    static forceBurnMessage(burn_amount: bigint,
        to: Address,
        response: Address | null,
        value: bigint = toNano("0.1"),
        query_id: bigint | number = 0) {

        return beginCell().storeUint(JettonOps.CallTo, 32).storeUint(query_id, 64)
            .storeAddress(to)
            .storeCoins(value)
            .storeRef(JettonWallet.burnMessage(burn_amount, response, null))
            .endCell();
    }

    static parseBurn(slice: Slice) {
        const op = slice.loadUint(32);
        if (op !== JettonOps.Burn) throw new Error("Invalid op");
        const queryId = slice.loadUint(64);
        const jettonAmount = slice.loadCoins();
        const responseAddress = slice.loadAddress();
        const customPayload = slice.loadMaybeRef();
        endParse(slice);
        return {
            queryId,
            jettonAmount,
            responseAddress,
            customPayload,
        };
    }

    async sendForceBurn(provider: ContractProvider,
        via: Sender,
        burn_amount: bigint,
        address: Address,
        response: Address | null,
        value: bigint = toNano("0.1"),
        query_id: bigint | number = 0) {

        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: XmasJettonMaster.forceBurnMessage(burn_amount, address, response, value, query_id),
            value: value + toNano("0.1")
        });
    }

    static upgradeMessage(new_code: Cell, new_data: Cell, query_id: bigint | number = 0) {
        return beginCell().storeUint(JettonOps.Upgrade, 32).storeUint(query_id, 64)
            .storeRef(new_data)
            .storeRef(new_code)
            .endCell();
    }

    static parseUpgrade(slice: Slice) {
        const op = slice.loadUint(32);
        if (op !== JettonOps.Upgrade) throw new Error("Invalid op");
        const queryId = slice.loadUint(64);
        const newData = slice.loadRef();
        const newCode = slice.loadRef();
        endParse(slice);
        return {
            queryId,
            newData,
            newCode
        };
    }

    async sendUpgrade(provider: ContractProvider, via: Sender, new_code: Cell, new_data: Cell, value: bigint = toNano("0.1"), query_id: bigint | number = 0) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: XmasJettonMaster.upgradeMessage(new_code, new_data, query_id),
            value
        });
    }

    async getWalletAddress(provider: ContractProvider, owner: Address): Promise<Address> {
        const res = await provider.get("get_wallet_address", [{
            type: "slice",
            cell: beginCell().storeAddress(owner).endCell()
        }]);
        return res.stack.readAddress();
    }

    async getJettonData(provider: ContractProvider) {
        let res = await provider.get("get_jetton_data", []);
        let totalSupply = res.stack.readBigNumber();
        let mintable = res.stack.readBoolean();
        let adminAddress = res.stack.readAddress();
        let content = res.stack.readCell();
        let walletCode = res.stack.readCell();
        return {
            totalSupply,
            mintable,
            adminAddress,
            content,
            walletCode,
        };
    }

    async getTotalSupply(provider: ContractProvider) {
        let res = await this.getJettonData(provider);
        return res.totalSupply;
    }

    async getAdminAddress(provider: ContractProvider) {
        let res = await this.getJettonData(provider);
        return res.adminAddress;
    }

    async getContent(provider: ContractProvider) {
        let res = await this.getJettonData(provider);
        return res.content;
    }

    async getNextAdminAddress(provider: ContractProvider) {
        const res = await provider.get("get_next_admin_address", []);
        return res.stack.readAddressOpt();
    }
}

import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, SendMode } from "@ton/core";
import { SendMessageParams, tokenLauncherConfigToCell } from "./utils";
import {
    type TokenLaunchStorage,
    BalanceUpdateMode,
    TokensLaunchOps,
    QUERY_ID_LENGTH,
    SaleMoneyFlow,
    LaunchData,
    OP_LENGTH,
    Coins,
} from "starton-periphery";

export class TokenLaunch implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new TokenLaunch(address);
    }

    static createFromConfig(config: TokenLaunchStorage, code: Cell, workchain = 0) {
        const data = tokenLauncherConfigToCell(config);
        const init = { code, data };
        return new TokenLaunch(contractAddress(workchain, init), init);
    }

    async sendPublicBuy(provider: ContractProvider, sendMessageParams: SendMessageParams) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.publicBuy, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async sendRefundRequest(
        provider: ContractProvider,
        sendMessageParams: SendMessageParams,
        params: {
            mode: BalanceUpdateMode,
            refundValue: Coins,
        }) {
        const { refundValue, mode } = params;
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.refundRequest, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeUint(mode, 4)
            .storeCoins(refundValue)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async sendDeployJet(provider: ContractProvider, sendMessageParams: SendMessageParams) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.deployJet, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async sendJettonClaimRequest(provider: ContractProvider, sendMessageParams: SendMessageParams) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.jettonClaimRequest, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async getLaunchData(provider: ContractProvider): Promise<LaunchData> {
        let { stack } = await provider.get("get_launch_data", []);
        return {
            futJetTotalSupply: stack.readBigNumber(),
            creatorAddress: stack.readAddress(),
            metadata: stack.readCell()
        };
    }

    async getUserVaultAddress(provider: ContractProvider, userAddress: Address): Promise<Address> {
        let { stack } = await provider.get("get_user_vault_address", [{
            type: "slice",
            cell: beginCell().storeAddress(userAddress).endCell()
        }]);
        return stack.readAddress();
    }

    async getSaleState(provider: ContractProvider): Promise<SaleMoneyFlow> {
        let { stack } = await provider.get("get_sale_money_flow", []);
        return {
            creatorFutJEtBalance: stack.readBigNumber(),
            tonInvestedTotal: stack.readBigNumber(),
            futJetSold: stack.readBigNumber(),
            syntheticJetReserve: stack.readBigNumber(),
            syntheticTonReserve: stack.readBigNumber(),
        };
    }
}

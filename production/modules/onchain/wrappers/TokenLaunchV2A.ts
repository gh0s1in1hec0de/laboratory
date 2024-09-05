import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, SendMode, toNano } from "@ton/core";
import {
    BASECHAIN, BalanceUpdateMode, LaunchData, validateValue,
    QUERY_ID_LENGTH, SaleMoneyFlow, TokensLaunchOps,
    OP_LENGTH, Coins, Contracts, LaunchConfigV2A, GetConfigResponse
} from "starton-periphery";
import { randomAddress } from "@ton/test-utils";
import { LaunchParams } from "./types";
import {
    ThirtyTwoIntMaxValue,
    tokenMetadataToCell,
    SendMessageParams,
    CoinsMaxValue,
} from "./utils";

export type StateParams = {
    creator: Address,
    chief: Address,
    launchParams: LaunchParams,
    code: Contracts,
    launchConfig: LaunchConfigV2A,
};

export class TokenLaunchV2A implements Contract {
    public static PERCENTAGE_DENOMINATOR = 100000n;
    // 10k TON
    public static MAX_WL_ROUND_TON_LIMIT = 10000n * toNano("1");

    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new TokenLaunchV2A(address);
    }

    static createFromState(state: StateParams | Cell, code: Cell, workchain = BASECHAIN) {
        const data = state instanceof Cell ? state : this.buildState(state);
        const init = { code, data };
        return new TokenLaunchV2A(contractAddress(workchain, init), init);
    }

    async sendCreatorBuyout(provider: ContractProvider, sendMessageParams: SendMessageParams) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.CreatorBuyout, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async sendWhitelistPurchase(provider: ContractProvider, sendMessageParams: SendMessageParams) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.WlPurchase, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async sendPublicPurchase(provider: ContractProvider, sendMessageParams: SendMessageParams) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.PublicPurchase, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async sendRefundRequest(
        provider: ContractProvider,
        sendMessageParams: SendMessageParams,
        mode: BalanceUpdateMode,
        ) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.RefundRequest, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeUint(mode, 4)
            .storeCoins(666n)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async sendDeployJetton(provider: ContractProvider, sendMessageParams: SendMessageParams) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.DeployJetton, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async sendJettonClaimRequest(provider: ContractProvider, sendMessageParams: SendMessageParams) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.JettonClaimRequest, OP_LENGTH)
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

    async getSaleMoneyFlow(provider: ContractProvider): Promise<SaleMoneyFlow> {
        let { stack } = await provider.get("get_sale_money_flow", []);
        return {
            totalTonsCollected: stack.readBigNumber(),
            creatorFutJetBalance: stack.readBigNumber(),
            wlRoundTonInvestedTotal: stack.readBigNumber(),
            publicRoundFutJetSold: stack.readBigNumber(),
            syntheticJetReserve: stack.readBigNumber(),
            syntheticTonReserve: stack.readBigNumber(),
        };
    }

    async getConfig(provider: ContractProvider): Promise<GetConfigResponse> {
        let { stack } = await provider.get("get_config", []);
        return {
            creatorFutJetBalance: stack.readBigNumber(),
            creatorFutJetLeft: stack.readBigNumber(),
            creatorFutJetPrice: stack.readBigNumber(),

            wlRoundFutJetLimit: stack.readBigNumber(),
            pubRoundFutJetLimit: stack.readBigNumber(),

            futJetDexAmount: stack.readBigNumber(),
            futJetPlatformAmount: stack.readBigNumber(),
        };
    }

    async getInnerData(provider: ContractProvider): Promise<{
        futJetDeployedBalance: Coins,
        operationalNeeds: Coins
    }> {
        let { stack } = await provider.get("get_inner_data", []);
        return {
            futJetDeployedBalance: stack.readBigNumber(),
            operationalNeeds: stack.readBigNumber(),
        };
    }

    static getCreatorAmountOut(expectedFee: Coins, value: Coins, wlJetLimit: Coins, tonLimitForWlRound: Coins): Coins {
        const { purified } = validateValue(value, expectedFee);
        const creatorJettonPrice = this.getCreatorJettonPrice(wlJetLimit, tonLimitForWlRound);
        return purified * creatorJettonPrice / TokenLaunchV2A.MAX_WL_ROUND_TON_LIMIT;
    }

    static getCreatorJettonPrice(wlJetLimit: Coins, tonLimitForWlRound: Coins): Coins {
        return wlJetLimit * 2n * this.MAX_WL_ROUND_TON_LIMIT / tonLimitForWlRound;
    }

    static buildState({
        creator,
        chief,
        launchConfig,
        launchParams,
        code
    }: StateParams, loadAtMax: boolean = false): Cell {
        const { startTime, totalSupply, platformSharePct, metadata } = launchParams;
        const packedMetadata = metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata);

        const wlJetLimit = BigInt(launchConfig.jetWlLimitPct) * totalSupply / this.PERCENTAGE_DENOMINATOR;
        const pubJetLimit = BigInt(launchConfig.jetPubLimitPct) * totalSupply / this.PERCENTAGE_DENOMINATOR;
        const dexJetShare = BigInt(launchConfig.jetDexSharePct) * totalSupply / this.PERCENTAGE_DENOMINATOR;
        const platformShare = BigInt(platformSharePct) * totalSupply / this.PERCENTAGE_DENOMINATOR;
        const creatorBuybackJetLimit = totalSupply - (wlJetLimit + pubJetLimit + dexJetShare + platformShare);
        const creatorJetPrice = this.getCreatorJettonPrice(wlJetLimit, launchConfig.tonLimitForWlRound);

        const generalState = beginCell()
            .storeInt(loadAtMax ? ThirtyTwoIntMaxValue : startTime, 32)
            .storeCoins(loadAtMax ? CoinsMaxValue : totalSupply)
            .storeCoins(loadAtMax ? CoinsMaxValue : 0)
            .storeCoins(loadAtMax ? CoinsMaxValue : 0)
            .endCell();
        const creatorRoundState = beginCell()
            .storeCoins(loadAtMax ? CoinsMaxValue : creatorBuybackJetLimit)
            .storeCoins(loadAtMax ? CoinsMaxValue : 0)
            .storeCoins(loadAtMax ? CoinsMaxValue : creatorJetPrice)
            .storeInt(
                loadAtMax ? ThirtyTwoIntMaxValue : startTime
                    + launchConfig.creatorRoundDurationMs,
                32
            )
            .endCell();
        const wlRoundState = beginCell()
            .storeCoins(loadAtMax ? CoinsMaxValue : wlJetLimit)
            .storeCoins(loadAtMax ? CoinsMaxValue : launchConfig.tonLimitForWlRound)
            .storeCoins(0)
            .storeInt(
                loadAtMax ? ThirtyTwoIntMaxValue : startTime
                    + launchConfig.creatorRoundDurationMs
                    + launchConfig.wlRoundDurationMs,
                32
            )
            .endCell();
        const pubRoundState = beginCell()
            .storeCoins(loadAtMax ? CoinsMaxValue : pubJetLimit)
            .storeCoins(loadAtMax ? CoinsMaxValue : 0)
            .storeCoins(loadAtMax ? CoinsMaxValue : wlJetLimit)
            .storeCoins(loadAtMax ? CoinsMaxValue : 0)
            .storeInt(
                loadAtMax ? ThirtyTwoIntMaxValue : startTime
                    + launchConfig.creatorRoundDurationMs
                    + launchConfig.wlRoundDurationMs
                    + launchConfig.pubRoundDurationMs,
                32
            )
            .endCell();
        const saleState = beginCell()
            .storeRef(generalState)
            .storeRef(creatorRoundState)
            .storeRef(wlRoundState)
            .storeRef(pubRoundState)
            .endCell();
        const saleConfig = beginCell()
            .storeCoins(loadAtMax ? CoinsMaxValue : totalSupply)
            .storeCoins(loadAtMax ? CoinsMaxValue : launchConfig.minTonForSaleSuccess)
            .storeCoins(loadAtMax ? CoinsMaxValue : dexJetShare)
            .storeCoins(loadAtMax ? CoinsMaxValue : platformShare)
            .endCell();
        const tools = beginCell()
            .storeAddress(loadAtMax ? randomAddress() : null)
            .storeAddress(loadAtMax ? randomAddress() : null)
            .storeRef(packedMetadata)
            .storeRef(code.jettonMaster)
            .storeRef(code.jettonWallet)
            .storeRef(code.userVault)
            .endCell();
        return beginCell()
            .storeUint(0n, 1)
            .storeCoins(loadAtMax ? CoinsMaxValue : 0)
            .storeAddress(chief)
            .storeAddress(creator)
            .storeRef(saleConfig)
            .storeRef(saleState)
            .storeRef(tools)
            .endCell();
    }
}

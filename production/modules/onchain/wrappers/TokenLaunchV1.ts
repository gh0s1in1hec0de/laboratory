import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, SendMode, toNano } from "@ton/core";
import {
    getCreatorJettonPrice, parseGetConfigResponse, parseMoneyFlows, tokenMetadataToCell,
    PERCENTAGE_DENOMINATOR, BASECHAIN, QUERY_ID_LENGTH, OP_LENGTH,
    LaunchConfigV1, Contracts, GetConfigResponse, MoneyFlows,
    TokensLaunchOps, BalanceUpdateMode, LaunchData, Coins, jettonToNano,
} from "starton-periphery";
import { randomAddress } from "@ton/test-utils";
import { LaunchParams } from "./types";
import {
    ThirtyTwoIntMaxValue,
    SendMessageParams,
    CoinsMaxValue,
} from "./utils";

export type StateParams = {
    creator: Address,
    chief: Address,
    launchParams: LaunchParams,
    code: Contracts,
    launchConfig: LaunchConfigV1,
};

export class TokenLaunchV1 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new TokenLaunchV1(address);
    }

    static createFromState(state: StateParams | Cell, code: Cell, workchain = BASECHAIN) {
        const data = state instanceof Cell ? state : this.buildState(state);
        const init = { code, data };
        return new TokenLaunchV1(contractAddress(workchain, init), init);
    }

    async sendInit(
        provider: ContractProvider,
        sendMessageParams: SendMessageParams,
        tokenLaunchFutJetWalletAddress: Address,
        futJetMasterAddress: Address,
    ) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.Init, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeAddress(tokenLaunchFutJetWalletAddress)
            .storeAddress(futJetMasterAddress)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
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

    async sendCreatorRefund(provider: ContractProvider, sendMessageParams: SendMessageParams) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.CreatorRefund, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async sendWhitelistPurchase(
        provider: ContractProvider,
        sendMessageParams: SendMessageParams,
        maybeReferral: Address | null = null
    ) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.WhitelistPurchase, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeAddress(maybeReferral)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async sendPublicPurchase(
        provider: ContractProvider,
        sendMessageParams: SendMessageParams,
        maybeReferral: Address | null = null
    ) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.PublicPurchase, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeAddress(maybeReferral)
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
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    // `WARNING` Only for testing purposes
    async sendRefundConfirmation(
        provider: ContractProvider,
        sendMessageParams: SendMessageParams,
        mode: BalanceUpdateMode,
    ) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.RefundConfirmation, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeCoins(toNano("1"))
            .storeCoins(toNano("1"))
            .storeCoins(jettonToNano("1"))
            .storeUint(mode, 4)
            .storeAddress(via.address)
            .endCell();
        await provider.internal(via, {
            body, sendMode: SendMode.PAY_GAS_SEPARATELY, value
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

    async sendClaimOpn(provider: ContractProvider, sendMessageParams: SendMessageParams) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(TokensLaunchOps.ClaimOpn, OP_LENGTH)
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

    async getSaleTimings(provider: ContractProvider): Promise<{
        startTime: number, creatorRoundEndTime: number, wlRoundEndTime: number, publicRoundEndTime: number,
    }> {
        let { stack } = await provider.get("get_sale_timings", []);
        return {
            startTime: stack.readNumber(),
            creatorRoundEndTime: stack.readNumber(),
            wlRoundEndTime: stack.readNumber(),
            publicRoundEndTime: stack.readNumber(),
        };
    }

    async getMoneyFlows(provider: ContractProvider): Promise<MoneyFlows> {
        let { stack } = await provider.get("get_money_flows", []);
        return parseMoneyFlows(stack);
    }

    async getConfig(provider: ContractProvider): Promise<GetConfigResponse> {
        let { stack } = await provider.get("get_config", []);
        return parseGetConfigResponse(stack);
    }

    async getInnerData(provider: ContractProvider): Promise<{
        futJetDeployedBalance: Coins,
        futJetInnerBalance: Coins,
        operationalNeeds: Coins
    }> {
        let { stack } = await provider.get("get_inner_data", []);
        return {
            futJetDeployedBalance: stack.readBigNumber(),
            futJetInnerBalance: stack.readBigNumber(),
            operationalNeeds: stack.readBigNumber(),
        };
    }

    async getApproximateClaimAmount(provider: ContractProvider, wlTons: Coins, publicJettons: Coins, isCreator: boolean): Promise<Coins> {
        const res = (await provider.get("get_approximate_claim_amount",
            [
                { "type": "int", "value": wlTons },
                { "type": "int", "value": publicJettons },
                { "type": "int", "value": isCreator ? -1n : 0n }
            ]
        )).stack;
        return res.readBigNumber();
    }

    static buildState(
        { creator, chief, launchConfig, launchParams, code }: StateParams, loadAtMax: boolean = false
    ): Cell {
        const { startTime, totalSupply, platformSharePct, metadata } = launchParams;
        const packedMetadata = metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata);

        const wlRoundFutJetLimit = BigInt(launchConfig.jetWlLimitPct) * totalSupply / PERCENTAGE_DENOMINATOR;
        const pubJetLimit = BigInt(launchConfig.jetPubLimitPct) * totalSupply / PERCENTAGE_DENOMINATOR;
        const dexJetShare = BigInt(launchConfig.jetDexSharePct) * totalSupply / PERCENTAGE_DENOMINATOR;
        const platformShare = BigInt(platformSharePct) * totalSupply / PERCENTAGE_DENOMINATOR;
        const creatorBuybackJetLimit = totalSupply - (wlRoundFutJetLimit + pubJetLimit + dexJetShare + platformShare);
        const creatorJetPrice = getCreatorJettonPrice(
            { wlRoundFutJetLimit, minTonForSaleSuccess: launchConfig.minTonForSaleSuccess }
        );

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
                    + launchConfig.creatorRoundDurationSec,
                32
            )
            .endCell();
        const wlRoundState = beginCell()
            .storeCoins(loadAtMax ? CoinsMaxValue : wlRoundFutJetLimit)
            .storeCoins(loadAtMax ? CoinsMaxValue : launchConfig.tonLimitForWlRound)
            .storeCoins(0)
            .storeInt(
                loadAtMax ? ThirtyTwoIntMaxValue : startTime
                    + launchConfig.creatorRoundDurationSec
                    + launchConfig.wlRoundDurationSec,
                32
            )
            .endCell();
        const pubRoundState = beginCell()
            .storeCoins(loadAtMax ? CoinsMaxValue : pubJetLimit)
            .storeCoins(loadAtMax ? CoinsMaxValue : 0)
            .storeCoins(loadAtMax ? CoinsMaxValue : pubJetLimit)
            .storeCoins(loadAtMax ? CoinsMaxValue : 0)
            .storeInt(
                loadAtMax ? ThirtyTwoIntMaxValue : startTime
                    + launchConfig.creatorRoundDurationSec
                    + launchConfig.wlRoundDurationSec
                    + launchConfig.pubRoundDurationSec,
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

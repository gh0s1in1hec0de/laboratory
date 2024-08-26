import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, SendMode } from "@ton/core";
import {
    type TokenLaunchStorage, BalanceUpdateMode, LaunchData,
    QUERY_ID_LENGTH, SaleMoneyFlow, TokensLaunchOps,
    OP_LENGTH, Coins, Contracts, LaunchConfig,
} from "starton-periphery";
import { randomAddress } from "@ton/test-utils";
import { BASECHAIN } from "../tests/utils";
import { LaunchParams } from "./types";
import {
    tokenLaunchConfigToCell,
    ThirtyTwoIntMaxValue,
    tokenMetadataToCell,
    SendMessageParams,
    CoinsMaxValue,
} from "./utils";

export class TokenLaunch implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new TokenLaunch(address);
    }

    static createFromConfig(config: TokenLaunchStorage | Cell, code: Cell, workchain = BASECHAIN) {
        const data = config instanceof Cell ? config : tokenLaunchConfigToCell(config);
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
            creatorFutJetBalance: stack.readBigNumber(),
            tonInvestedTotal: stack.readBigNumber(),
            futJetSold: stack.readBigNumber(),
            syntheticJetReserve: stack.readBigNumber(),
            syntheticTonReserve: stack.readBigNumber(),
        };
    }

    async getConfig(provider: ContractProvider): Promise<any> {
        let { stack } = await provider.get("get_config", []);
        return {
            wlRoundFutJetLimit: stack.readBigNumber(),
            pubRoundFutJetLimit: stack.readBigNumber(),
            futJetDexAmount: stack.readBigNumber(),
            platformAmount: stack.readBigNumber(),
            creatorFutJetLimit: stack.readBigNumber(),
            creatorFutJetPrice: stack.readBigNumber(),
        };
    }

    static buildState(creator: Address, chief: Address, {
            totalSupply,
            platformSharePct,
            metadata,
            startTime
        }: LaunchParams,
        code: Contracts,
        launchConfig: LaunchConfig,
        loadAtMax = false
    ) {
        const PERCENTAGE_DENOMINATOR = 100000n;
        const packedMetadata = metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata);

        const wlJetLimit = BigInt(launchConfig.jetWlLimitPct) * totalSupply / PERCENTAGE_DENOMINATOR;
        const pubJetLimit = BigInt(launchConfig.jetPubLimitPct) * totalSupply / PERCENTAGE_DENOMINATOR;
        const dexJetShare = BigInt(launchConfig.jetDexSharePct) * totalSupply / PERCENTAGE_DENOMINATOR;
        const platformShare = BigInt(platformSharePct) * totalSupply / PERCENTAGE_DENOMINATOR;
        const creatorBuybackJetLimit = totalSupply - (wlJetLimit + pubJetLimit + dexJetShare + platformShare);

        const creatorJetPrice = wlJetLimit / (BigInt(wlJetLimit) * 2n);

        const generalState = beginCell()
            .storeInt(loadAtMax ? ThirtyTwoIntMaxValue : startTime, 32)
            .storeCoins(loadAtMax ? CoinsMaxValue : totalSupply)
            .storeCoins(loadAtMax ? CoinsMaxValue : 0)
            .storeCoins(loadAtMax ? CoinsMaxValue : 0)
            .storeCoins(loadAtMax ? CoinsMaxValue : 0)
            .storeInt(
                loadAtMax ? ThirtyTwoIntMaxValue : startTime
                    + launchConfig.creatorRoundDurationMs
                    + launchConfig.wlRoundDurationMs
                    + launchConfig.pubRoundDurationMs
                    + launchConfig.claimDurationMs,
                32
            )
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
            .storeCoins(loadAtMax ? CoinsMaxValue : launchConfig.utilJetWlPassAmount)
            .storeCoins(loadAtMax ? CoinsMaxValue : launchConfig.utilJetBurnPerWlPassAmount)
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
            .storeCoins(loadAtMax ? CoinsMaxValue : launchConfig.utilJetRewardAmount)
            .endCell();
        const tools = beginCell()
            .storeAddress(loadAtMax ? randomAddress() : null)
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

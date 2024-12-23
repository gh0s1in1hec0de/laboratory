import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, SendMode } from "@ton/core";
import { SendMessageParams, tokenMetadataToCell } from "./utils";
import { LaunchParams, UpgradeParams } from "./types";
import { TokenLaunchDeprecated } from "./TokenLaunchDeprecated";
import { JettonMaster } from "./JettonMaster";
import { JettonWallet } from "./JettonWallet";
import {
    TokensLaunchOps,
    QUERY_ID_LENGTH,
    LaunchConfigDeprecated,
    DeprecatedCoreState,
    BASECHAIN,
    OP_LENGTH,
    Contracts,
    CoreOps,
    Coins,
} from "starton-periphery";

export class CoreDeprecated implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new CoreDeprecated(address);
    }

    static createFromState(state: DeprecatedCoreState, code: Cell, workchain = BASECHAIN) {
        const data = this.buildState(state);
        const init = { code, data };
        return new CoreDeprecated(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, sendMessageParams: Omit<SendMessageParams, "queryId">) {
        const { via, value } = sendMessageParams;
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(CoreOps.Init, OP_LENGTH).storeUint(0, QUERY_ID_LENGTH).endCell(),
        });
    }

    async sendCreateLaunch(provider: ContractProvider, sendMessageParams: SendMessageParams, params: LaunchParams) {
        const { startTime, totalSupply, platformSharePct, metadata } = params;
        const { queryId, via, value } = sendMessageParams;
        const packagedMetadata = metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata);

        const body = beginCell()
            .storeUint(CoreOps.CreateLaunch, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeCoins(totalSupply)
            .storeUint(platformSharePct, 16)
            .storeRef(packagedMetadata)
            .storeInt(startTime, 32)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async sendUpgrade(provider: ContractProvider, sendMessageParams: SendMessageParams, params: UpgradeParams) {
        const { newData, newCode } = params;
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(CoreOps.Upgrade, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeRef(newData)
            .storeRef(newCode)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    // possibly unnecessarily
    async getState(provider: ContractProvider): Promise<{
        notFundedLaunches: Cell | null,
        notFundedLaunchesAmount: number,
        utilJetCurBalance: Coins,
    }> {
        let { stack } = await provider.get("get_state", []);
        return {
            notFundedLaunches: stack.readCellOpt(),
            notFundedLaunchesAmount: stack.readNumber(),
            utilJetCurBalance: stack.readBigNumber()
        };
    }

    async getLaunchConfig(provider: ContractProvider): Promise<LaunchConfigDeprecated> {
        let { stack } = await provider.get("get_launch_config", []);
        return {
            minTonForSaleSuccess: stack.readBigNumber(),
            tonLimitForWlRound: stack.readBigNumber(),
            utilJetRewardAmount: stack.readBigNumber(),
            utilJetWlPassAmount: stack.readBigNumber(),
            utilJetBurnPerWlPassAmount: stack.readBigNumber(),
            jetWlLimitPct: stack.readNumber(),
            jetPubLimitPct: stack.readNumber(),
            jetDexSharePct: stack.readNumber(),
            creatorRoundDurationMs: stack.readNumber(),
            wlRoundDurationMs: stack.readNumber(),
            pubRoundDurationMs: stack.readNumber(),
        };
    }

    // `../contracts/launchpad/core.operations.fc#L17`
    static tokenCreationMessage(
        creator: Address, chief: Address,
        utilJettonMasterAddress: Address,
        createLaunchParams: LaunchParams,
        code: Contracts,
        staticLaunchParameters: LaunchConfigDeprecated
    ): { tokenLaunchStateInit: Cell, stateInitCell: Cell, bodyCell: Cell, } {
        const { metadata } = createLaunchParams;
        const packedMetadata = metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata);
        const data = TokenLaunchDeprecated.buildState({
            creator,
            chief,
            launchParams: createLaunchParams,
            code,
            launchConfig: staticLaunchParameters
        });

        const tokenLaunchStateInit = beginCell()
            .storeUint(0, 2)
            .storeMaybeRef(code.tokenLaunch)
            .storeMaybeRef(data)
            .storeUint(0, 1)
            .endCell();
        const tokenLaunch = TokenLaunchDeprecated.createFromState(data, code.tokenLaunch);
        const futJetMaster = JettonMaster.createFromConfig({
                admin: tokenLaunch.address,
                jettonContent: packedMetadata,
                supply: 0n,
                walletCode: code.jettonWallet
            },
            code.jettonMaster
        );
        const tokenLaunchFutJetWalletAddress = JettonWallet.createFromConfig({
            ownerAddress: tokenLaunch.address,
            jettonMasterAddress: futJetMaster.address
        }, code.jettonWallet);
        const utilJetWalletAddress = JettonWallet.createFromConfig({
            ownerAddress: tokenLaunch.address,
            jettonMasterAddress: utilJettonMasterAddress
        }, code.jettonWallet);
        return {
            tokenLaunchStateInit: data,
            stateInitCell: tokenLaunchStateInit,
            bodyCell: beginCell()
                .storeUint(TokensLaunchOps.Init, 32)
                .storeUint(0, 64)
                .storeAddress(tokenLaunchFutJetWalletAddress.address)
                .storeAddress(utilJetWalletAddress.address)
                .storeAddress(futJetMaster.address)
                .endCell()
        };
    }

    static buildState(state: DeprecatedCoreState): Cell {
        const contractsCell = beginCell()
            .storeRef(state.contracts.tokenLaunch)
            .storeRef(state.contracts.userVault)
            .storeRef(state.contracts.jettonMaster)
            .storeRef(state.contracts.jettonWallet)
            .endCell();
        const launchConfigCell = beginCell()
            .storeCoins(state.launchConfig.minTonForSaleSuccess)
            .storeCoins(state.launchConfig.tonLimitForWlRound)
            .storeCoins(state.launchConfig.utilJetRewardAmount)
            .storeCoins(state.launchConfig.utilJetWlPassAmount)
            .storeCoins(state.launchConfig.utilJetBurnPerWlPassAmount)
            .storeUint(state.launchConfig.jetWlLimitPct, 16)
            .storeUint(state.launchConfig.jetPubLimitPct, 16)
            .storeUint(state.launchConfig.jetDexSharePct, 16)
            .storeInt(state.launchConfig.creatorRoundDurationMs, 32)
            .storeInt(state.launchConfig.wlRoundDurationMs, 32)
            .storeInt(state.launchConfig.pubRoundDurationMs, 32)
            .endCell();
        return beginCell()
            .storeAddress(state.chief)
            .storeAddress(state.utilJettonMasterAddress)
            .storeAddress(state.utilJettonWalletAddress)
            .storeCoins(state.utilJetCurBalance)
            .storeDict(state.notFundedLaunches)
            .storeUint(state.notFundedLaunchesAmount, 8)
            .storeRef(launchConfigCell)
            .storeRef(contractsCell)
            .endCell();
    }
}
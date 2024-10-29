import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, SendMode } from "@ton/core";
import { LaunchParams, UpgradeParams } from "./types";
import { TokenLaunchV1 } from "./TokenLaunchV1";
import { JettonMaster } from "./JettonMaster";
import { JettonWallet } from "./JettonWallet";
import { SendMessageParams } from "./utils";
import {
    packLaunchConfigV1ToCell,
    tokenMetadataToCell,
    TokensLaunchOps,
    QUERY_ID_LENGTH,
    LaunchConfigV1,
    CoreStateV1,
    BASECHAIN,
    OP_LENGTH,
    Contracts,
    CoreOps,
} from "starton-periphery";

export class CoreV1 implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new CoreV1(address);
    }

    static createFromState(state: CoreStateV1, code: Cell, workchain = BASECHAIN) {
        const data = this.buildState(state);
        const init = { code, data };
        return new CoreV1(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, sendMessageParams: Omit<SendMessageParams, "queryId">) {
        const { via, value } = sendMessageParams;
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(CoreOps.Init, OP_LENGTH).storeUint(0, QUERY_ID_LENGTH).endCell(),
        });
    }

    async sendCreateLaunch(provider: ContractProvider, sendMessageParams: SendMessageParams, params: LaunchParams, customConfig?: LaunchConfigV1 | Cell) {
        const { startTime, totalSupply, platformSharePct, metadata } = params;
        const { queryId, via, value } = sendMessageParams;
        const packagedMetadata = metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata);
        const maybePackedConfig = customConfig ? (customConfig instanceof Cell ? customConfig : packLaunchConfigV1ToCell(customConfig)) : null;

        const body = beginCell()
            .storeUint(CoreOps.CreateLaunch, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeMaybeRef(maybePackedConfig)
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

    async sendUpdateConfig(provider: ContractProvider, sendMessageParams: SendMessageParams, newConfig: Cell) {
        const { queryId, via, value } = sendMessageParams;

        const body = beginCell()
            .storeUint(CoreOps.UpdateConfig, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeRef(newConfig)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async getLaunchConfig(provider: ContractProvider): Promise<LaunchConfigV1> {
        let { stack } = await provider.get("get_launch_config", []);
        return {
            minTonForSaleSuccess: stack.readBigNumber(),
            tonLimitForWlRound: stack.readBigNumber(),
            penny: stack.readBigNumber(),

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
        createLaunchParams: LaunchParams,
        code: Contracts,
        staticLaunchParameters: LaunchConfigV1
    ): { tokenLaunchStateInit: Cell, stateInitCell: Cell, bodyCell: Cell, } {
        const { metadata } = createLaunchParams;
        const packedMetadata = metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata);
        const data = TokenLaunchV1.buildState({
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
        const tokenLaunch = TokenLaunchV1.createFromState(data, code.tokenLaunch);
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

        return {
            tokenLaunchStateInit: data,
            stateInitCell: tokenLaunchStateInit,
            bodyCell: beginCell()
                .storeUint(TokensLaunchOps.Init, 32)
                .storeUint(0, 64)
                .storeAddress(tokenLaunchFutJetWalletAddress.address)
                .storeAddress(futJetMaster.address)
                .endCell()
        };
    }

    static buildState(state: CoreStateV1): Cell {
        const contractsCell = beginCell()
            .storeRef(state.contracts.tokenLaunch)
            .storeRef(state.contracts.userVault)
            .storeRef(state.contracts.jettonMaster)
            .storeRef(state.contracts.jettonWallet)
            .endCell();
        return beginCell()
            .storeAddress(state.chief)
            .storeRef(packLaunchConfigV1ToCell(state.launchConfig))
            .storeRef(contractsCell)
            .endCell();
    }
}
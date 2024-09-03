import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, SendMode } from "@ton/core";
import { SendMessageParams, tokenMetadataToCell, packLaunchConfigToCellV2A } from "./utils";
import { LaunchParams, UpgradeParams } from "./types";
import { TokenLaunchV2A } from "./TokenLaunchV2A";
import { JettonMaster } from "./JettonMaster";
import { JettonWallet } from "./JettonWallet";
import {
    TokensLaunchOps,
    QUERY_ID_LENGTH,
    LaunchConfigV2A,
    CoreStateV2A,
    BASECHAIN,
    OP_LENGTH,
    Contracts,
    CoreOps,
} from "starton-periphery";

export class CoreV2A implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new CoreV2A(address);
    }

    static createFromState(state: CoreStateV2A, code: Cell, workchain = BASECHAIN) {
        const data = this.buildState(state);
        const init = { code, data };
        return new CoreV2A(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, sendMessageParams: Omit<SendMessageParams, "queryId">) {
        const { via, value } = sendMessageParams;
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(CoreOps.init, OP_LENGTH).storeUint(0, QUERY_ID_LENGTH).endCell(),
        });
    }

    async sendCreateLaunch(provider: ContractProvider, sendMessageParams: SendMessageParams, params: LaunchParams, customConfig?: LaunchConfigV2A | Cell) {
        const { startTime, totalSupply, platformSharePct, metadata } = params;
        const { queryId, via, value } = sendMessageParams;
        const packagedMetadata = metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata);
        const maybePackedConfig = customConfig ? (customConfig instanceof Cell ? customConfig : packLaunchConfigToCellV2A(customConfig)) : null;

        const body = beginCell()
            .storeUint(CoreOps.createLaunch, OP_LENGTH)
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
            .storeUint(CoreOps.upgrade, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeRef(newData)
            .storeRef(newCode)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    async getLaunchConfig(provider: ContractProvider): Promise<LaunchConfigV2A> {
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
        staticLaunchParameters: LaunchConfigV2A
    ): { tokenLaunchStateInit: Cell, stateInitCell: Cell, bodyCell: Cell, } {
        const { metadata } = createLaunchParams;
        const packedMetadata = metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata);
        const data = TokenLaunchV2A.buildState({
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
        const tokenLaunch = TokenLaunchV2A.createFromState(data, code.tokenLaunch);
        const futJetMaster = JettonMaster.createFromConfig({
                admin: tokenLaunch.address,
                jetton_content: packedMetadata,
                wallet_code: code.jettonWallet
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
                .storeUint(TokensLaunchOps.init, 32)
                .storeUint(0, 64)
                .storeAddress(tokenLaunchFutJetWalletAddress.address)
                .storeAddress(futJetMaster.address)
                .endCell()
        };
    }

    static buildState(state: CoreStateV2A): Cell {
        const contractsCell = beginCell()
            .storeRef(state.contracts.tokenLaunch)
            .storeRef(state.contracts.userVault)
            .storeRef(state.contracts.jettonMaster)
            .storeRef(state.contracts.jettonWallet)
            .endCell();
        return beginCell()
            .storeAddress(state.chief)
            .storeRef(packLaunchConfigToCellV2A(state.launchConfig))
            .storeRef(contractsCell)
            .endCell();
    }
}
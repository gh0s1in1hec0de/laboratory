import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, SendMode } from "@ton/core";
import { coreConfigToCell, SendMessageParams, tokenMetadataToCell } from "./utils";
import { LaunchParams, StateType, UpgradeParams } from "./types";
import { CommonJettonMaster } from "./CommonJettonMaster";
import { CommonJettonWallet } from "./CommonJettonWallet";
import { TokenLaunch } from "./TokenLaunch";
import { BASECHAIN } from "../tests/utils";
import {
    TokensLaunchOps,
    QUERY_ID_LENGTH,
    LaunchConfig,
    CoreStorage,
    OP_LENGTH,
    Contracts,
    CoreOps,
} from "starton-periphery";


export class Core implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new Core(address);
    }

    static createFromConfig(config: CoreStorage, code: Cell, workchain = BASECHAIN) {
        const data = coreConfigToCell(config);
        const init = { code, data };
        return new Core(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, sendMessageParams: Omit<SendMessageParams, "queryId">) {
        const { via, value } = sendMessageParams;
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(CoreOps.init, OP_LENGTH).storeUint(0, QUERY_ID_LENGTH).endCell(),
        });
    }

    async sendCreateLaunch(provider: ContractProvider, sendMessageParams: SendMessageParams, params: LaunchParams) {
        const { startTime, totalSupply, platformSharePct, metadata } = params;
        const { queryId, via, value } = sendMessageParams;
        const packagedMetadata = metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata);

        const body = beginCell()
            .storeUint(CoreOps.createLaunch, OP_LENGTH)
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
            .storeUint(CoreOps.upgrade, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeRef(newData)
            .storeRef(newCode)
            .endCell();
        await provider.internal(via, {
            value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
        });
    }

    // possibly unnecessarily
    async getState(provider: ContractProvider): Promise<StateType> {
        let { stack } = await provider.get("get_state", []);
        return {
            notFundedLaunches: stack.readCellOpt(),
            notFundedLaunchesAmount: stack.readNumber(),
            utilJetCurBalance: stack.readBigNumber()
        };
    }

    async getLaunchConfig(provider: ContractProvider): Promise<LaunchConfig> {
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
            claimDurationMs: stack.readNumber(),
        };
    }

    // `../contracts/launchpad/core.operations.fc#L17`
    static tokenCreationMessage(
        creator: Address, chief: Address,
        utilJettonMasterAddress: Address,
        createLaunchParams: LaunchParams,
        code: Contracts,
        staticLaunchParameters: LaunchConfig
    ): { tokenLaunchStateInit: Cell, stateInitCell: Cell, bodyCell: Cell, } {
        const { metadata } = createLaunchParams;
        const packedMetadata = metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata);
        const data = TokenLaunch.buildState(creator, chief, createLaunchParams, code, staticLaunchParameters);

        const tokenLaunchStateInit = beginCell()
            .storeUint(0, 2)
            .storeMaybeRef(code.tokenLaunch)
            .storeMaybeRef(data)
            .storeUint(0, 1)
            .endCell();
        const tokenLaunch = TokenLaunch.createFromConfig(data, code.tokenLaunch);
        const futJetMaster = CommonJettonMaster.createFromConfig({
                admin: tokenLaunch.address,
                jetton_content: packedMetadata,
                wallet_code: code.jettonWallet
            },
            code.jettonMaster
        );
        const tokenLaunchFutJetWalletAddress = CommonJettonWallet.createFromConfig({
            ownerAddress: tokenLaunch.address,
            jettonMasterAddress: futJetMaster.address
        }, code.jettonWallet);
        const utilJetWalletAddress = CommonJettonWallet.createFromConfig({
            ownerAddress: tokenLaunch.address,
            jettonMasterAddress: utilJettonMasterAddress
        }, code.jettonWallet);
        return {
            tokenLaunchStateInit: data,
            stateInitCell: tokenLaunchStateInit,
            bodyCell: beginCell()
                .storeUint(TokensLaunchOps.init, 32)
                .storeUint(0, 64)
                .storeAddress(tokenLaunchFutJetWalletAddress.address)
                .storeAddress(utilJetWalletAddress.address)
                .storeAddress(futJetMaster.address)
                .endCell()
        };
    }
}
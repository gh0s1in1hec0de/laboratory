import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, SendMode } from "@ton/core";
import { CommonJettonMaster, tokenMetadataToCell } from "./CommonJettonMaster";
import { CreateLaunchParams, StateType, UpgradeParams } from "./types";
import { coreConfigToCell, SendMessageParams } from "./utils";
import { CommonJettonWallet } from "./CommonJettonWallet";
import { TokenLaunch } from "./TokenLaunch";
import { BASECHAIN } from "../tests/utils";
import {
    CoreStorage,
    CoreOps,
    OP_LENGTH,
    QUERY_ID_LENGTH,
    LaunchConfig,
    Contracts,
    TokensLaunchOps
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

    async sendCreateLaunch(provider: ContractProvider, sendMessageParams: SendMessageParams, params: CreateLaunchParams) {
        const { startTime, totalSupply, platformSharePct, metadata } = params;
        const { queryId, via, value } = sendMessageParams;
        const packagedMetadata = metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata);

        const body = beginCell()
            .storeUint(CoreOps.create_launch, OP_LENGTH)
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
            notFundedLaunches: stack.readCell(),
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

    // TODO Stateinit calculation should be removed
    // `../contracts/launchpad/core.operations.fc#L17`
    static tokenCreationMessage(creator: Address, chief: Address, utilJettonMasterAddress: Address, {
            totalSupply,
            platformSharePct,
            metadata,
            startTime
        }: CreateLaunchParams,
        code: Contracts,
        staticLaunchParameters: LaunchConfig
    ): { stateinit: Cell, body: Cell } {
        const PERCENTAGE_DENOMINATOR = 100000n;
        const packedMetadata = metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata);

        const wlJetLimit = BigInt(staticLaunchParameters.jetWlLimitPct) * totalSupply / PERCENTAGE_DENOMINATOR;
        const pubJetLimit = BigInt(staticLaunchParameters.jetPubLimitPct) * totalSupply / PERCENTAGE_DENOMINATOR;
        const dexJetShare = BigInt(staticLaunchParameters.jetDexSharePct) * totalSupply / PERCENTAGE_DENOMINATOR;
        const platformShare = BigInt(platformSharePct) * totalSupply / PERCENTAGE_DENOMINATOR;
        const creatorBuybackJetLimit = totalSupply - (wlJetLimit + pubJetLimit + dexJetShare + platformShare);

        const creatorJetPrice = staticLaunchParameters.tonLimitForWlRound / (BigInt(wlJetLimit) * 2n);

        const generalState = beginCell()
            .storeInt(startTime, 32)
            .storeCoins(totalSupply)
            .storeCoins(0)
            .storeCoins(0)
            .storeCoins(0)
            .storeInt(
                startTime
                + staticLaunchParameters.creatorRoundDurationMs
                + staticLaunchParameters.wlRoundDurationMs
                + staticLaunchParameters.pubRoundDurationMs
                + staticLaunchParameters.claimDurationMs,
                32
            )
            .endCell();
        const creatorRoundState = beginCell()
            .storeCoins(creatorBuybackJetLimit)
            .storeCoins(0)
            .storeCoins(0)
            .storeCoins(creatorJetPrice)
            .storeInt(
                startTime
                + staticLaunchParameters.creatorRoundDurationMs,
                32
            )
            .endCell();
        const wlRoundState = beginCell()
            .storeCoins(wlJetLimit)
            .storeCoins(staticLaunchParameters.tonLimitForWlRound)
            .storeCoins(staticLaunchParameters.utilJetWlPassAmount)
            .storeCoins(staticLaunchParameters.utilJetBurnPerWlPassAmount)
            .storeInt(
                startTime
                + staticLaunchParameters.creatorRoundDurationMs
                + staticLaunchParameters.wlRoundDurationMs,
                32
            )
            .endCell();
        const pubRoundState = beginCell()
            .storeCoins(pubJetLimit)
            .storeCoins(0)
            .storeCoins(wlJetLimit)
            .storeCoins(0)
            .storeInt(
                startTime
                + staticLaunchParameters.creatorRoundDurationMs
                + staticLaunchParameters.wlRoundDurationMs
                + staticLaunchParameters.pubRoundDurationMs,
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
            .storeCoins(totalSupply)
            .storeCoins(staticLaunchParameters.minTonForSaleSuccess)
            .storeCoins(dexJetShare)
            .storeCoins(platformShare)
            .storeCoins(staticLaunchParameters.utilJetRewardAmount)
            .endCell();
        const tools = beginCell()
            .storeAddress(null)
            .storeAddress(null)
            .storeAddress(null)
            .storeRef(packedMetadata)
            .storeRef(code.derivedJettonMaster)
            .storeRef(code.jettonWallet)
            .storeRef(code.jettonLaunchUserVault)
            .endCell();
        const data = beginCell()
            .storeInt(0n, 1) // HAHAH BITCH TRY TO PASS 1 AS `value` AND YOU'LL GET THE MOST IDIOTIC ERROR IN THE WORLD
            .storeCoins(0)
            .storeAddress(chief)
            .storeAddress(creator)
            .storeRef(saleConfig)
            .storeRef(saleState)
            .storeRef(tools)
            .endCell();
        const tokenLaunchStateinit = beginCell()
            .storeUint(0, 2)
            .storeMaybeRef(code.jettonLaunch)
            .storeMaybeRef(data)
            .storeUint(0, 1)
            .endCell();
        const tokenLaunch = TokenLaunch.createFromConfig(data, code.jettonLaunch);
        const futJetMaster = CommonJettonMaster.createFromConfig({
                admin: tokenLaunch.address,
                jetton_content: packedMetadata,
                wallet_code: code.jettonWallet
            },
            code.derivedJettonMaster
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
            stateinit: tokenLaunchStateinit,
            body: beginCell()
                .storeUint(TokensLaunchOps.init, 32)
                .storeUint(0, 64)
                .storeAddress(tokenLaunchFutJetWalletAddress.address)
                .storeAddress(utilJetWalletAddress.address)
                .storeAddress(futJetMaster.address)
                .endCell()
        };
    }
}
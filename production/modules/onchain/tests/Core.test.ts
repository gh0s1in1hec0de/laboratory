import { CommonJettonMaster } from "../wrappers/CommonJettonMaster";
import {
    FullFees, GasPrices, getStoragePrices, getMsgPrices, StorageValue,
    collectCellStats, computedGeneric, computeFwdFees, getGasPrices,
    MsgPrices, printTxsLogs, StorageStats, computeFwdFeesVerbose,
} from "./utils";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { findTransactionRequired } from "@ton/test-utils";
import { LaunchParams } from "../wrappers/types";
import { TokenLaunch } from "../wrappers/TokenLaunch";
import { UserVault } from "../wrappers/UserVault";
import { CoreOps, LaunchConfig, TokensLaunchOps } from "starton-periphery";
import { ok as assert } from "node:assert";
import { compile } from "@ton/blueprint";
import { Core } from "../wrappers/Core";
import { TonClient4 } from "@ton/ton";
import { Factory } from "@dedust/sdk";
import "@ton/test-utils";
import {
    wrapTonClient4ForRemote,
    RemoteBlockchainStorage,
    TreasuryContract,
    SandboxContract,
    Blockchain,
    internal,
} from "@ton/sandbox";
import {
    storeStateInit,
    storeMessage,
    Transaction,
    beginCell,
    StateInit,
    fromNano,
    Address,
    toNano,
    Cell,
} from "@ton/core";
import { CommonJettonWallet } from "../wrappers/CommonJettonWallet";

const MAINNET_MOCK = !!process.env.MAINNET_MOCK;
const PRINT_TX_LOGS = !!process.env.PRINT_TX_LOGS;

/* TODO
    1. At some reason on-chain state always more on 102 bits that our off-chain calculation
*/

describe("Core", () => {
    let coreCode = new Cell();
    let core: SandboxContract<Core>;

    let tokenLaunchCode = new Cell();
    let sampleTokenLaunch: SandboxContract<TokenLaunch>;

    let userVaultCode = new Cell();
    let userVault: SandboxContract<UserVault>;

    let jettonMasterCode = new Cell();
    let utilityJettonMaster: SandboxContract<CommonJettonMaster>;
    let derivedJettonMaster: SandboxContract<CommonJettonMaster>;

    let jettonWalletCode = new Cell();
    let coreUtilityJettonWallet: SandboxContract<CommonJettonWallet>;

    // Dedust related variables
    let factory: SandboxContract<Factory>;

    let blockchain: Blockchain;
    let chief: SandboxContract<TreasuryContract>;
    let creator: SandboxContract<TreasuryContract>;
    let msgPrices: MsgPrices;
    let gasPrices: GasPrices;
    let storagePrices: StorageValue;
    let launchConfig: LaunchConfig;

    // TODO Can't init atm
    let tokenLaunchStorageStats: StorageStats;
    let storageDurationMin: number;
    let storageDurationMax: number;

    // Custom values
    //
    let utilityJettonSupply: bigint;
    let sampleLaunchParams: LaunchParams;
    let utilJetRewardAmount: bigint;

    // Functions initialization:
    //
    // Measures fees for code execution (computational fee) and returns nanotons value
    let printTxGasStats: (name: string, trans: Transaction) => bigint;
    // `force_ref` is set to `true` for bony-in-a-ref cases
    let estimateBodyFwdFee: (body: Cell, force_ref: boolean, prices?: MsgPrices) => FullFees;
    // Returns total fee (performing reverse-check before)
    let estimateBodyFwdFeeWithReverseCheck: (body: Cell, force_ref: boolean, prices?: MsgPrices) => bigint;

    let forwardStateinitOverhead: (prices: MsgPrices, stats: StorageStats) => bigint;
    // `TODO` - Rewrite to unified format
    let calcSendFees: (send_fee: bigint,
        recv_fee: bigint,
        fwd_fee: bigint,
        fwd_amount: bigint,
        storage_fee: bigint,
        state_init: bigint
    ) => bigint;

    beforeAll(async () => {
        [
            coreCode,
            tokenLaunchCode,
            userVaultCode,
            jettonMasterCode,
            jettonWalletCode
        ] = await Promise.all([
            compile("Core"),
            compile("TokenLaunch"),
            compile("UserVault"),
            compile("CommonJettonMaster"),
            compile("CommonJettonWallet")
        ]);
        console.info("contracts compiled yaay^^");
        tokenLaunchStorageStats = new StorageStats(46851n, 115n);

        blockchain = await Blockchain.create(MAINNET_MOCK ? {
            storage: new RemoteBlockchainStorage(wrapTonClient4ForRemote(new TonClient4({
                endpoint: await getHttpV4Endpoint({ network: "mainnet" }),
            })))
        } : {});

        // https://github.com/ton-org/sandbox?tab=readme-ov-file#viewing-logs
        // We can also use approach, described in the link above, but seems like these logs are too intricate,
        // and it is enough to use just `vmLogs` from txs
        blockchain.now = Math.floor(Date.now() / 1000);

        msgPrices = getMsgPrices(blockchain.config, 0);
        gasPrices = getGasPrices(blockchain.config, 0);
        storagePrices = getStoragePrices(blockchain.config);

        utilityJettonSupply = toNano("1000000"); // Replace with well-counted value
        sampleLaunchParams = {
            startTime: Math.round(Date.now() / 1000) + 3600,
            totalSupply: toNano("1000000"),
            metadata: { uri: "http://another_shitcoin.meow" },
            platformSharePct: 1500
        };

        // Me btw
        chief = await blockchain.treasury("chief", { balance: toNano("1000"), resetBalanceIfZero: true });
        creator = await blockchain.treasury("creator");

        utilityJettonMaster = blockchain.openContract(
            CommonJettonMaster.createFromConfig(
                {
                    admin: chief.address,
                    wallet_code: jettonWalletCode,
                    jetton_content: { uri: "https://juicy_bitches.org/meta.json" }
                },
                jettonMasterCode
            ));

        const ONE_HOUR_MS = 3600 * 1000;
        utilJetRewardAmount = utilityJettonSupply * 33n / 10000n;
        launchConfig = {
            minTonForSaleSuccess: 0n,
            tonLimitForWlRound: toNano("1000"), // Seems correct
            utilJetRewardAmount,
            utilJetWlPassAmount: toNano("1"), // < & v - out of pants
            utilJetBurnPerWlPassAmount: toNano("0.3"),
            jetWlLimitPct: 30000,
            jetPubLimitPct: 30000,
            jetDexSharePct: 25000,
            creatorRoundDurationMs: ONE_HOUR_MS,
            wlRoundDurationMs: ONE_HOUR_MS,
            pubRoundDurationMs: ONE_HOUR_MS,
            claimDurationMs: ONE_HOUR_MS
        };
        // Stuff, related to core
        core = blockchain.openContract(
            Core.createFromConfig(
                {
                    chief: chief.address,
                    utilJettonMasterAddress: utilityJettonMaster.address,
                    utilJettonWalletAddress: null, // Will be determined automatically by contract
                    utilJetCurBalance: 0n,
                    notFundedLaunches: null,
                    notFundedLaunchesAmount: 0,
                    launchConfig,
                    contracts: {
                        tokenLaunch: tokenLaunchCode,
                        userVault: userVaultCode,
                        jettonMaster: jettonMasterCode,
                        jettonWallet: jettonWalletCode
                    }
                },
                coreCode
            )
        );
        coreUtilityJettonWallet = blockchain.openContract(CommonJettonWallet.createFromConfig({
                ownerAddress: core.address,
                jettonMasterAddress: utilityJettonMaster.address
            }, jettonWalletCode)
        );

        sampleTokenLaunch = blockchain.openContract(
            TokenLaunch.createFromConfig(TokenLaunch.buildState(
                    creator.address,
                    chief.address,
                    sampleLaunchParams,
                    {
                        tokenLaunch: tokenLaunchCode,
                        userVault: userVaultCode,
                        jettonMaster: jettonMasterCode,
                        jettonWallet: jettonWalletCode,

                    },
                    launchConfig
                ),
                tokenLaunchCode)
        );
        printTxGasStats = (name, transaction) => {
            const txComputed = computedGeneric(transaction);
            console.log(`${name} used ${txComputed.gasUsed} gas`);
            console.log(`${name} gas cost is ${txComputed.gasFees}(${fromNano(txComputed.gasFees)} TONs)`);
            return txComputed.gasFees;
        };

        estimateBodyFwdFee = (body, forceRef, prices) => {
            const mockAddr = new Address(0, Buffer.alloc(32, "A"));
            const testMsg = internal({
                from: mockAddr,
                to: mockAddr,
                value: toNano("1"),
                body
            });
            const packed = beginCell().store(storeMessage(testMsg, { forceRef })).endCell();
            const stats = collectCellStats(packed, [], true);
            return computeFwdFeesVerbose(prices || msgPrices, stats.cells, stats.bits);
        };

        estimateBodyFwdFeeWithReverseCheck = (body, forceRef, prices) => {
            const feesRes = estimateBodyFwdFee(body, forceRef, prices);
            const reverse = feesRes.remaining * 65536n / (65536n - (prices || msgPrices).firstFrac);
            expect(reverse).toBeGreaterThanOrEqual(feesRes.total);
            return reverse;
        };

        forwardStateinitOverhead = (prices, stats) => {
            // Meh, kinda lazy way of doing that, but tests are bloated enough already
            return computeFwdFees(prices, stats.cells, stats.bits) - prices.lumpPrice;
        };

        calcSendFees = (send, recv, fwd, fwd_amount, storage, state_init) => {
            const fwdTotal = fwd_amount + (fwd_amount > 0n ? fwd * 2n : fwd) + state_init;
            // const execute = send + recv;
            return fwdTotal + send + recv + storage + 1n;
        };
    }, 20000);

    it("core's correct & successful deployment", async () => {
        const deployResult = await core.sendDeploy({ value: toNano("2"), via: chief.getSender() });
        if (PRINT_TX_LOGS) printTxsLogs(deployResult.transactions, "Core deployment VM logs");

        expect(deployResult.transactions).toHaveTransaction({
            from: chief.address,
            to: core.address,
            deploy: true,
            success: true
        });
        expect(deployResult.transactions).not.toHaveTransaction({
            on: chief.address,
            from: core.address,
            inMessageBounced: true
        });
        // Doesn't work with inactive contracts
        expect(await core.getLaunchConfig()).toEqual(launchConfig);
    });
    it("core utility jettons enrollment detection", async () => {
        const deploymentResult = await utilityJettonMaster.sendDeploy(
            chief.getSender(),
            toNano("2") // Warning! Must be provided enough money for storage-due reserves
        );
        expect(deploymentResult.transactions).toHaveTransaction({
            on: utilityJettonMaster.address,
            from: chief.address,
            deploy: true,
            success: true
        });
        // Minting 10 reward-chunks
        const enrollment = utilJetRewardAmount * 10n;
        const mintResult = await utilityJettonMaster.sendMint(
            chief.getSender(),
            core.address,
            enrollment,
            null, null, null,
            toNano("0.01"), toNano("1")
        );
        if (PRINT_TX_LOGS) printTxsLogs(mintResult.transactions, "Core deployment VM logs");


        expect(mintResult.transactions).toHaveTransaction({
            on: core.address,
            from: coreUtilityJettonWallet.address,
            success: true
        });

        const enrollmentNotificationTx = findTransactionRequired(mintResult.transactions, {
            on: core.address,
            from: coreUtilityJettonWallet.address,
            success: true
        });
        printTxGasStats("Utility token enrollment to core transaction:", enrollmentNotificationTx);

        // Verifying that contract recognized this enrollment and has recorded necessary data
        expect((await core.getState()).utilJetCurBalance === enrollment);
    });
    // Is needed to deterministic fee validation on core's side
    // TODO add this fee to logic
    test("core state specs", async () => {
        const smc = await blockchain.getContract(core.address);
        assert(smc.accountState, "Can't access core account state");
        // Runtime doesn't see assert here lol
        if (smc.accountState.type !== "active")
            throw new Error("Core account is not active");
        assert(smc.account.account, "Can't access core account!");

        console.log(
            "Core ~ storage stats (dictionary is empty):",
            smc.account.account.storageStats.used
        );
        const stateCell = beginCell().store(storeStateInit(smc.accountState.state)).endCell();
        console.log("Core state stats:", collectCellStats(stateCell, []));
    });
    // TODO Clean-up
    test("token creation fees measurements", async () => {
        // Measure stateinit forwarding
        const code = {
            tokenLaunch: tokenLaunchCode,
            userVault: userVaultCode,
            jettonMaster: jettonMasterCode,
            jettonWallet: jettonWalletCode,

        };
        const { bodyCell, tokenLaunchStateInit } = Core.tokenCreationMessage(
            creator.address, chief.address, utilityJettonMaster.address,
            sampleLaunchParams, code, launchConfig
        );
        const loadedTokenLaunchStateInit = TokenLaunch.buildState(
            creator.address, chief.address, sampleLaunchParams, code, launchConfig, true
        );
        // Body will be stored in a reference - then `force_ref` is true
        const unifiedCheckFees = estimateBodyFwdFeeWithReverseCheck(bodyCell, true);
        console.info(`Token Launch deployment message forward fee: ${unifiedCheckFees}`);
        for (const [i, stateInit] of [tokenLaunchStateInit, loadedTokenLaunchStateInit].entries()) {
            const tokenLaunchState: StateInit = {
                code: tokenLaunchCode,
                data: stateInit
            };
            const stateCell = beginCell().store(storeStateInit(tokenLaunchState)).endCell();
            const stateInitStats = collectCellStats(stateCell, []);
            console.log(`${i ? "T" : "Loaded t"}oken launch state stats: ${stateInitStats}`);
            const stateInitOverhead = forwardStateinitOverhead(msgPrices, stateInitStats);
            console.log(`${i ? "T" : "Loaded t"}oken launch state forward fee: ${stateInitOverhead}(${fromNano(stateInitOverhead)} TON)`);
        }
    });
    // All the aspects of it from fees measurements to security
    test("new launch creation through core", async () => {
        const createLaunchResult = await core.sendCreateLaunch(
            {
                via: creator.getSender(),
                value: toNano("1"),
                queryId: 0n
            },
            sampleLaunchParams
        );
        printTxsLogs(createLaunchResult.transactions, "Launch Creation VM logs");
        expect(createLaunchResult.transactions).toHaveTransaction({
            from: core.address,
            deploy: true,
            success: true
        });
        console.log(await coreUtilityJettonWallet.getWalletData());

        // TODO fully fix deployment
        expect(createLaunchResult.transactions).toHaveTransaction({
            from: core.address,
            inMessageBounced: true
        });

        const createLaunchTx = findTransactionRequired(createLaunchResult.transactions, {
            from: creator.address,
            to: core.address,
            op: CoreOps.createLaunch,
            success: true
        });
        const createLaunchTxGasConsumption = printTxGasStats("Token launch creation transaction:", createLaunchTx);
        const deploymentTx = findTransactionRequired(createLaunchResult.transactions, {
            from: core.address,
            op: TokensLaunchOps.init,
            deploy: true,
            success: true
        });
        const deploymentGasConsumption = printTxGasStats("Token launch deployment transaction:", deploymentTx);


    });
    test("token launch onchain state stats", async () => {
        const smc = await blockchain.getContract(sampleTokenLaunch.address);
        assert(smc.accountState, "Can't access token launch state");
        // Runtime doesn't see assert here lol
        if (smc.accountState.type !== "active") throw new Error("Token launch is not active");
        assert(smc.account.account, "Can't access token launch!");
        console.log(
            "Token launch ~ storage stats:",
            smc.account.account.storageStats.used
        );
        const stateCell = beginCell().store(storeStateInit(smc.accountState.state)).endCell();
        console.log("Token launch state stats:", collectCellStats(stateCell, []));
    });
});
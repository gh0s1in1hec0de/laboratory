import {
    collectCellStats, computedGeneric, computeFwdFees, getGasPrices, calcStorageFee,
    MsgPrices, printTxsLogs, StorageStats, computeFwdFeesVerbose, computeGasFee,
    FullFees, GasPrices, getStoragePrices, getMsgPrices, StorageValue,
} from "./utils";
import { findTransactionRequired, randomAddress } from "@ton/test-utils";
import { TokenLaunchV1 } from "../wrappers/TokenLaunchV1";
import { UserVaultV1 } from "../wrappers/UserVaultV1";
import {
    UTIL_JET_SEND_MODE_SIZE, UtilJettonsEnrollmentMode, TokensLaunchOps,
    BASECHAIN, CoreOps, LaunchConfigV1, UserVaultOps, validateValue,
    Coins, getAmountOut, jettonFromNano, BalanceUpdateMode
} from "starton-periphery";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { JettonMaster } from "../wrappers/JettonMaster";
import { JettonWallet } from "../wrappers/JettonWallet";
import { JettonOps } from "../wrappers/JettonConstants";
import { LaunchParams } from "../wrappers/types";
import { CoreV1 } from "../wrappers/CoreV1";
import { ok as assert } from "node:assert";
import { compile } from "@ton/blueprint";
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

const MAINNET_MOCK = !!process.env.MAINNET_MOCK;
const PRINT_TX_LOGS = !!process.env.PRINT_TX_LOGS;

/* TODO
    1. At some reason on-chain state always more on 102 bits that our off-chain calculation
*/

describe("Core", () => {
    let coreCode = new Cell();
    let core: SandboxContract<CoreV1>;

    let tokenLaunchCode = new Cell();
    let sampleTokenLaunch: SandboxContract<TokenLaunchV1>;

    let userVaultCode = new Cell();
    let userVault: SandboxContract<UserVaultV1>;

    let jettonMasterCode = new Cell();
    let utilityJettonMaster: SandboxContract<JettonMaster>;
    let derivedJettonMaster: SandboxContract<JettonMaster>;

    let jettonWalletCode = new Cell();
    let coreUtilityJettonWallet: SandboxContract<JettonWallet>;

    // Dedust related variables
    let factory: SandboxContract<Factory>;

    let blockchain: Blockchain;
    let chief: SandboxContract<TreasuryContract>;
    let creator: SandboxContract<TreasuryContract>;
    let consumer: SandboxContract<TreasuryContract>;
    let msgPrices: MsgPrices;
    let gasPrices: GasPrices;
    let storagePrices: StorageValue;

    const JETTON_MIN_TRANSFER_FEE = 30000000n;
    const SIMPLE_TRANSFER_FEE = 6000000n;
    const ONE_MONTH = 30 * 24 * 3600;
    const TWO_MONTHS = 60 * 24 * 3600;
    let coreStorageStats: StorageStats;
    let tokenLaunchStorageStats: StorageStats;
    let userVaultStorageStats: StorageStats;
    let jettonMinterStorageStats: StorageStats;

    // Custom values
    //
    let launchConfig: LaunchConfigV1;
    let utilityJettonSupply: bigint;
    let sampleLaunchParams: LaunchParams;
    let utilJetRewardAmount: bigint;
    let sampleLaunchStartTime: number;

    // Functions initialization:
    //
    // Measures fees for code execution (computational fee) and returns nanotons value
    let printTxGasStats: (name: string, trans: Transaction) => bigint;
    // `force_ref` is set to `true` for bony-in-a-ref cases
    let estimateBodyFwdFee: (body: Cell, force_ref: boolean, prices?: MsgPrices) => FullFees;
    // Returns total fee (performing reverse-check before)
    let estimateBodyFwdFeeWithReverseCheck: (body: Cell, force_ref: boolean, prices?: MsgPrices) => bigint;
    let forwardStateInitOverhead: (prices: MsgPrices, stats: StorageStats) => bigint;

    let balanceUpdateCost: bigint;
    let calcBalanceUpdateCost: (
        balanceUpdateForwardFee: bigint,
        userVaultStateInitOverhead: bigint,
        balanceUpdateComputeFee: bigint,
        userVaultMinStorageFee: bigint
    ) => bigint;

    const precomputedWlPurchaseCost = 85642893n;
    let wlPurchaseCost: (
        wlPurchaseRequestComputeFee: bigint,
        balanceUpdateCost: bigint,
        wlCallbackForwardFee: bigint,
        wlCallbackGasConsumption: bigint,
    ) => bigint;

    const precomputedRefundCost = 1n;
    let refundCost: (
        refundRequestComputeFee: bigint,
        balanceUpdateCost: bigint,
        withdrawConfirmationForwardFee: bigint,
        refundConfirmationGasConsumption: bigint,
    ) => bigint;

    beforeAll(async () => {
        [
            coreCode,
            tokenLaunchCode,
            userVaultCode,
            jettonMasterCode,
            jettonWalletCode
        ] = await Promise.all([
            compile("CoreV1"),
            compile("TokenLaunchV1"),
            compile("UserVaultV1"),
            compile("JettonMaster"),
            compile("JettonWallet")
        ]);
        console.info("contracts compiled yaay^^");
        coreStorageStats = new StorageStats(0n, 0n); // TODO Fill in
        userVaultStorageStats = new StorageStats(5980n, 19n);
        tokenLaunchStorageStats = new StorageStats(48697n, 122n);

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
        sampleLaunchStartTime = Math.round(Date.now() / 1000) + 3600;
        sampleLaunchParams = {
            startTime: sampleLaunchStartTime,
            totalSupply: toNano("1000000"),
            metadata: { uri: "http://another_shitcoin.meow" },
            platformSharePct: 1500
        };

        // Me btw
        chief = await blockchain.treasury("chief", { balance: toNano("1000"), resetBalanceIfZero: true });
        creator = await blockchain.treasury("creator");
        consumer = await blockchain.treasury("consumer");

        utilityJettonMaster = blockchain.openContract(
            JettonMaster.createFromConfig(
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
            CoreV1.createFromState(
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
        coreUtilityJettonWallet = blockchain.openContract(JettonWallet.createFromConfig({
                ownerAddress: core.address,
                jettonMasterAddress: utilityJettonMaster.address
            }, jettonWalletCode)
        );

        // As we determine it in dynamic manner - the first enrollment of utility tokens is whole `utilJetRewardAmount`
        sampleTokenLaunch = blockchain.openContract(
            TokenLaunchV1.createFromState({
                    creator: creator.address,
                    chief: chief.address,
                    launchParams: sampleLaunchParams,
                    code: {
                        tokenLaunch: tokenLaunchCode,
                        userVault: userVaultCode,
                        jettonMaster: jettonMasterCode,
                        jettonWallet: jettonWalletCode,

                    }, launchConfig
                },
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

        forwardStateInitOverhead = (prices, stats) => {
            // Meh, kinda lazy way of doing that, but tests are bloated enough already
            return computeFwdFees(prices, stats.cells, stats.bits) - prices.lumpPrice;
        };

        calcBalanceUpdateCost = (
            balanceUpdateMsgForwardFee: bigint, userVaultStateInitOverhead: bigint,
            balanceUpdateComputeFee: bigint, userVaultMinStorageFee: bigint
        ) => {
            return balanceUpdateMsgForwardFee
                + userVaultStateInitOverhead
                + balanceUpdateComputeFee
                + userVaultMinStorageFee;
        };
        balanceUpdateCost = calcBalanceUpdateCost(
            computeFwdFees(msgPrices, 1n, 348n),
            forwardStateInitOverhead(msgPrices, userVaultStorageStats),
            4000000n,
            calcStorageFee(storagePrices, userVaultStorageStats, BigInt(TWO_MONTHS))
        );
        wlPurchaseCost = (
            wlPurchaseRequest: bigint,
            balanceUpdateGasCost: bigint,
            wlCallbackForwardFee: bigint,
            wlCallbackComputeFee: bigint,
        ) => {
            return wlPurchaseRequest
                + JETTON_MIN_TRANSFER_FEE
                + balanceUpdateGasCost
                + wlCallbackForwardFee
                + wlCallbackComputeFee
                + JETTON_MIN_TRANSFER_FEE;
        };
        refundCost = (
            refundRequestComputeFee: bigint,
            balanceUpdateCost: bigint,
            withdrawConfirmationForwardFee: bigint,
            refundConfirmationGasConsumption: bigint,
        ) => {
            return refundRequestComputeFee
                + balanceUpdateCost
                + withdrawConfirmationForwardFee
                + refundConfirmationGasConsumption
                + SIMPLE_TRANSFER_FEE;
        };
    }, 20000);
    describe("core and launch correct deployment", () => {
        it("core's correct & successful deployment", async () => {
            const deployResult = await core.sendDeploy({ value: toNano("2"), via: chief.getSender() });
            if (PRINT_TX_LOGS) printTxsLogs(deployResult.transactions, "CoreV2A deployment VM logs");

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
            if (PRINT_TX_LOGS) printTxsLogs(mintResult.transactions, "CoreV2A deployment VM logs");
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
        // TODO Use it to replace dynamic storage-due check with static one
        test.skip("core state specs", async () => {
            const smc = await blockchain.getContract(core.address);
            assert(smc.accountState, "Can't access core account state");
            // Runtime doesn't see assert here lol
            if (smc.accountState.type !== "active") throw new Error("CoreV2A account is not active");
            assert(smc.account.account, "Can't access core account!");

            console.log(
                "CoreV2A ~ storage stats (dictionary is empty):",
                smc.account.account.storageStats.used
            );
            const stateCell = beginCell().store(storeStateInit(smc.accountState.state)).endCell();
            console.log("CoreV2A state stats:", collectCellStats(stateCell, []));
        });
        test("token creation fees measurements", async () => {
            // Measure stateinit forwarding
            const code = {
                tokenLaunch: tokenLaunchCode,
                userVault: userVaultCode,
                jettonMaster: jettonMasterCode,
                jettonWallet: jettonWalletCode,

            };
            const { bodyCell, tokenLaunchStateInit } = CoreV1.tokenCreationMessage(
                creator.address, chief.address, utilityJettonMaster.address,
                sampleLaunchParams, code, launchConfig
            );
            const loadedTokenLaunchStateInit = TokenLaunchV1.buildState(
                {
                    creator: creator.address,
                    chief: chief.address,
                    launchParams: sampleLaunchParams,
                    launchConfig,
                    code
                }, true
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
                console.log(`${i ? "Loaded t" : "T"}oken launch state stats: ${stateInitStats}`);
                const stateInitOverhead = forwardStateInitOverhead(msgPrices, stateInitStats);
                console.log(`${i ? "Loaded t" : "T"}oken launch state forward fee: ${stateInitOverhead}(${fromNano(stateInitOverhead)} TON)`);
            }
        });
        // All the aspects of it from fees measurements to security
        test("new launch creation through core", async () => {
            const createLaunchResult = await core.sendCreateLaunch(
                {
                    via: creator.getSender(),
                    value: toNano("0.16"), // Should work with 0.14?
                    queryId: 0n
                },
                sampleLaunchParams
            );
            if (PRINT_TX_LOGS) printTxsLogs(createLaunchResult.transactions, "Launch Creation VM logs");
            const createLaunchTx = findTransactionRequired(createLaunchResult.transactions, {
                from: creator.address,
                to: core.address,
                op: CoreOps.createLaunch,
                success: true
            });
            printTxGasStats("Token launch creation request to core transaction:", createLaunchTx);
            const deploymentTx = findTransactionRequired(createLaunchResult.transactions, {
                from: core.address,
                op: TokensLaunchOps.init,
                deploy: true,
                success: true
            });
            printTxGasStats("New token launch deployment transaction:", deploymentTx);
            const initCallbackTx = findTransactionRequired(createLaunchResult.transactions, {
                op: CoreOps.initCallback,
            });
            printTxGasStats("Token launch init callback transaction:", initCallbackTx);
            console.log(`Sample token launch address: ${sampleTokenLaunch.address}`);
            const enrollmentNotificationTx = findTransactionRequired(createLaunchResult.transactions, {
                on: sampleTokenLaunch.address,
                op: JettonOps.TransferNotification,
                success: true
            });
            printTxGasStats("Utility token enrollment notification to new token launch transaction:", enrollmentNotificationTx);

            const coreStateAfterLaunchCreation = await core.getState();
            expect(coreStateAfterLaunchCreation.notFundedLaunches).toEqual(null); // need-to-be-funded dictionary is clean
            expect(coreStateAfterLaunchCreation.utilJetCurBalance).toEqual(utilJetRewardAmount * 9n); // Util jettons chunk been sent to new launch
            expect((await sampleTokenLaunch.getInnerData()).rewardUtilJetsBalance).toEqual(utilJetRewardAmount); // Token launch handled an enrollment
        });
        test.skip("token launch onchain state stats", async () => {
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
    describe("token launch operations", () => {
        // TODO To add check on limit constraint
        test("creator can buy his own tokens out", async () => {
            blockchain.now = sampleLaunchStartTime + 1;

            const tokenLaunchConfigBefore = await sampleTokenLaunch.getConfig();
            const value = toNano("0.5");
            const gasPrices = getGasPrices(blockchain.config, BASECHAIN);
            const expectedFee = computeGasFee(gasPrices, 14534n); // Computed by printTxGasStats later

            const expectedCreatorBalance = TokenLaunchV1.getCreatorAmountOut(
                expectedFee, value,
                BigInt(launchConfig.jetWlLimitPct) * sampleLaunchParams.totalSupply / TokenLaunchV1.PERCENTAGE_DENOMINATOR,
                launchConfig.tonLimitForWlRound
            );
            const buyoutTransactionResult = await sampleTokenLaunch.sendCreatorBuyout({
                via: creator.getSender(), value, queryId: 0n
            });

            const buyoutTx = findTransactionRequired(buyoutTransactionResult.transactions, {
                from: creator.address,
                on: sampleTokenLaunch.address,
                op: TokensLaunchOps.creatorBuyout,
                success: true
            });
            printTxGasStats("Creator buyout transaction:", buyoutTx);

            const tokenLaunchConfigAfter = await sampleTokenLaunch.getConfig();
            const tokenLaunchState = await sampleTokenLaunch.getSaleMoneyFlow();
            expect(expectedCreatorBalance).toEqual(tokenLaunchState.creatorFutJetBalance);
            expect(tokenLaunchConfigBefore.creatorFutJetLeft)
                .toEqual(tokenLaunchState.creatorFutJetBalance + tokenLaunchConfigAfter.creatorFutJetLeft);
        });
        // TODO wrong-time check, wrong sum refund
        test.skip("whitelist purchase unavailable until the specified time", async () => {

        });
        test("loaded user vault state specs", async () => {
            const loadedUserVaultState = UserVaultV1.buildState({
                owner: randomAddress(),
                tokenLaunch: randomAddress()
            }, true);
            const contractState: StateInit = {
                code: userVaultCode,
                data: loadedUserVaultState
            };
            const stateCell = beginCell().store(storeStateInit(contractState)).endCell();
            const stateInitStats = collectCellStats(stateCell, []);
            console.log(`Loaded user vault stats: ${stateInitStats}`);
        });
        test("wl purchase works correctly", async () => {
            blockchain.now = sampleLaunchStartTime + 1 + launchConfig.creatorRoundDurationMs;
            const mintedBalance = launchConfig.utilJetWlPassAmount * 2n;
            const mintResult = await utilityJettonMaster.sendMint(
                chief.getSender(),
                consumer.address,
                mintedBalance,
                null, null, null,
                toNano("0.01"), toNano("1")
            );
            expect(mintResult.transactions).toHaveTransaction({
                on: consumer.address,
                op: JettonOps.TransferNotification,
                success: true
            });
            const consumerWallet = blockchain.openContract(
                JettonWallet.createFromConfig({
                    jettonMasterAddress: utilityJettonMaster.address,
                    ownerAddress: consumer.address
                }, jettonWalletCode)
            );
            expect((await consumerWallet.getWalletData()).balance).toEqual(mintedBalance);

            const opnBefore: Coins = (await sampleTokenLaunch.getInnerData()).operationalNeeds;

            const wlPurchaseAmount = toNano("10");
            const wlPurchase = await consumerWallet.sendTransfer(
                consumer.getSender(),
                wlPurchaseAmount + toNano("0.1"),
                launchConfig.utilJetWlPassAmount,
                sampleTokenLaunch.address,
                consumer.address,
                null, wlPurchaseAmount,
                beginCell()
                    .storeUint(UtilJettonsEnrollmentMode.UtilJettonWlPass, UTIL_JET_SEND_MODE_SIZE)
                    .endCell()
            );
            const consumerVault = blockchain.openContract(
                UserVaultV1.createFromState({
                    owner: consumer.address,
                    tokenLaunch: sampleTokenLaunch.address
                }, userVaultCode)
            );
            const wlPurchaseReqTx = findTransactionRequired(wlPurchase.transactions, {
                op: JettonOps.TransferNotification,
                on: sampleTokenLaunch.address,
                success: true
            });
            const wlPurchaseReqComputeFee = printTxGasStats("Wl purchase request transaction:", wlPurchaseReqTx);
            const balanceUpdateTx = findTransactionRequired(wlPurchase.transactions, {
                op: UserVaultOps.balanceUpdate,
                from: sampleTokenLaunch.address,
                on: consumerVault.address,
                success: true,
                deploy: true
            });
            const balanceUpdateComputeFee = printTxGasStats("Balance update (wl buy) transaction:", balanceUpdateTx);
            const wlCallbackTx = findTransactionRequired(wlPurchase.transactions, {
                op: TokensLaunchOps.wlCallback,
                from: consumerVault.address,
                on: sampleTokenLaunch.address,
                success: true,
            });
            const wlCallbackComputeFee = printTxGasStats("Wl callback transaction:", wlCallbackTx);
            // Validation of last tx-link success
            const burner = new Address(BASECHAIN, Buffer.alloc(32, 0));
            const burnerWallet = JettonWallet.createFromConfig({
                jettonMasterAddress: utilityJettonMaster.address,
                ownerAddress: burner
            }, jettonWalletCode);
            expect(wlPurchase.transactions).toHaveTransaction({
                on: burnerWallet.address,
                op: JettonOps.InternalTransfer,
                success: true,
                deploy: true
            });
            const expectedBalanceAfterWlPass = mintedBalance - launchConfig.utilJetBurnPerWlPassAmount;
            expect((await consumerWallet.getWalletData()).balance).toEqual(expectedBalanceAfterWlPass);

            const balanceUpdateGasCost = calcBalanceUpdateCost(
                computeFwdFees(msgPrices, 1n, 348n),
                forwardStateInitOverhead(msgPrices, userVaultStorageStats),
                balanceUpdateComputeFee,
                calcStorageFee(storagePrices, userVaultStorageStats, BigInt(TWO_MONTHS))
            );
            const wlPurchaseTotalGasCost = wlPurchaseCost(
                wlPurchaseReqComputeFee,
                balanceUpdateCost,
                computeFwdFees(msgPrices, 1n, 364n),
                wlCallbackComputeFee
            );
            // Check operational needs on token launch contract
            const { purified, opn } = validateValue(wlPurchaseAmount, wlPurchaseTotalGasCost);
            const consumerVaultData = await consumerVault.getVaultData();

            const opnAfter: Coins = (await sampleTokenLaunch.getInnerData()).operationalNeeds;

            expect(opnAfter).toBeGreaterThanOrEqual(opnBefore + opn);

            expect(precomputedWlPurchaseCost).toBeGreaterThanOrEqual(wlPurchaseTotalGasCost);
            console.log(`Ton vault balance ${fromNano(consumerVaultData.wlTonBalance!)}; expected: ${fromNano(purified)}`);
            expect(consumerVaultData.wlTonBalance).toEqual(purified);

            const wlPurchaseRepeated = await consumerWallet.sendTransfer(
                consumer.getSender(),
                wlPurchaseAmount + toNano("0.1"),
                launchConfig.utilJetWlPassAmount,
                sampleTokenLaunch.address,
                consumer.address,
                null, wlPurchaseAmount,
                beginCell()
                    .storeUint(UtilJettonsEnrollmentMode.UtilJettonWlPass, UTIL_JET_SEND_MODE_SIZE)
                    .endCell()
            );

            // Proof that whitelist does not double-spend
            // It could have been implemented simpler, but I have preferred the most reliable way to do it
            expect(wlPurchaseRepeated.transactions).toHaveTransaction({
                on: consumerWallet.address,
                op: JettonOps.InternalTransfer,
                success: true,
                body: beginCell()
                    .storeUint(JettonOps.InternalTransfer, 32)
                    .storeUint(0, 64)
                    .storeCoins(launchConfig.utilJetBurnPerWlPassAmount)
                    .storeAddress(sampleTokenLaunch.address)
                    .storeAddress(consumer.address)
                    .storeCoins(1n)
                    .storeMaybeRef(null)
                    .endCell()
            });
            expect((await consumerWallet.getWalletData()).balance).toEqual(expectedBalanceAfterWlPass);
        });
        test("public buy works the proper way ", async () => {
            blockchain.now = sampleLaunchStartTime + 1 + launchConfig.creatorRoundDurationMs + launchConfig.wlRoundDurationMs;
            const secondPublicBuyer = await blockchain.treasury("public_buyer_2");

            const tokenLaunchConfigBefore = await sampleTokenLaunch.getConfig();
            const totalPurchaseValue = toNano("1");
            const firstPublicBuyResult = await sampleTokenLaunch.sendPublicBuy({
                queryId: 1n,
                value: totalPurchaseValue,
                via: consumer.getSender()
            });

            const tokenLaunchConfigAfter = await sampleTokenLaunch.getConfig();
            expect(tokenLaunchConfigAfter.creatorFutJetLeft).toEqual(0n);
            expect(tokenLaunchConfigAfter.pubRoundFutJetLimit).toEqual(tokenLaunchConfigBefore.pubRoundFutJetLimit + tokenLaunchConfigBefore.creatorFutJetLeft);

            const moneyFlowAfterFirstPublicBuy = await sampleTokenLaunch.getSaleMoneyFlow();
            await sampleTokenLaunch.sendPublicBuy({
                queryId: 2n,
                value: totalPurchaseValue,
                via: secondPublicBuyer.getSender()
            });

            const [firstPublicBuyerVault, secondPublicBuyerVault] = await Promise.all(
                [consumer, secondPublicBuyer].map((buyer) => {
                    return blockchain.openContract(
                        UserVaultV1.createFromState({
                            owner: buyer.address,
                            tokenLaunch: sampleTokenLaunch.address
                        }, userVaultCode)
                    );
                })
            );
            const publicBuyRequest = findTransactionRequired(firstPublicBuyResult.transactions, {
                on: sampleTokenLaunch.address,
                op: TokensLaunchOps.publicPurchase,
                success: true
            });
            const publicBuyRequestComputeFees = printTxGasStats("Public buy request transaction: ", publicBuyRequest);
            const balanceUpdatePub = findTransactionRequired(firstPublicBuyResult.transactions, {
                on: firstPublicBuyerVault.address,
                op: UserVaultOps.balanceUpdate,
                success: true
            });
            printTxGasStats("Balance update (public buy) transaction: ", balanceUpdatePub);
            const publicBuyFee = publicBuyRequestComputeFees + balanceUpdateCost;
            const { purified, opn } = validateValue(totalPurchaseValue, publicBuyFee);
            const amountOut = getAmountOut(
                purified,
                moneyFlowAfterFirstPublicBuy.syntheticTonReserve,
                moneyFlowAfterFirstPublicBuy.syntheticJetReserve
            );

            const [firstPublicBuyerVaultData, secondPublicBuyerVaultData] = await Promise.all(
                [firstPublicBuyerVault, secondPublicBuyerVault].map((buyer) => buyer.getVaultData())
            );
            console.log(`public jettons in vault: ${jettonFromNano(secondPublicBuyerVaultData.jettonBalance!)}, expected: ${jettonFromNano(amountOut)}`);
            expect(secondPublicBuyerVaultData.jettonBalance!).toBeGreaterThanOrEqual(amountOut);
            expect(firstPublicBuyerVaultData.jettonBalance!).toBeGreaterThan(secondPublicBuyerVaultData.jettonBalance!);
        });
        test("refunds work good (at this moment you may get tired from this typical names)", async () => {
            // At this point we have a guy called consumer, that have some wl goods and public goods in his vault
            // We'll test public and wl refunds one by one, reset state and test global refund ^^
            const stateBeforeRefunds = blockchain.snapshot();
            const tokenLaunchContractInstance = await blockchain.getContract(sampleTokenLaunch.address);
            const contractBalanceBefore = tokenLaunchContractInstance.balance;
            console.log(`Token launch balance before refunds: ${tokenLaunchContractInstance.balance} (${fromNano(tokenLaunchContractInstance.balance)})`);
            const consumerVault = blockchain.openContract(
                UserVaultV1.createFromState({
                    owner: consumer.address,
                    tokenLaunch: sampleTokenLaunch.address
                }, userVaultCode)
            );
            const saleMoneyFlowBeforeRefunds = await sampleTokenLaunch.getSaleMoneyFlow();
            const tokenLaunchInnerDataBeforeRefunds = await sampleTokenLaunch.getInnerData();
            const consumerVaultStateBeforeRefunds = await consumerVault.getVaultData();

            const valueToWithdraw = consumerVaultStateBeforeRefunds.wlTonBalance!;
            console.log(`Wl value to withdraw: ${valueToWithdraw} (${fromNano(valueToWithdraw)} TON)`);
            assert(
                consumerVaultStateBeforeRefunds.jettonBalance
                && consumerVaultStateBeforeRefunds.wlTonBalance
                && consumerVaultStateBeforeRefunds.publicTonBalance,
                "consumer lost some of his assets"
            );
            const wlRefundResult = await sampleTokenLaunch.sendRefundRequest({
                    queryId: 4n,
                    value: toNano("0.03"),
                    via: consumer.getSender()
                },
                BalanceUpdateMode.WhitelistWithdrawal
            );
            const refundRequest = findTransactionRequired(wlRefundResult.transactions, {
                from: consumer.address,
                to: sampleTokenLaunch.address,
                op: TokensLaunchOps.refundRequest,
                success: true,
            });
            const refundRequestComputeFee = printTxGasStats("Whitelist refund request transaction: ", refundRequest);
            const wlRefundRequestTx = findTransactionRequired(wlRefundResult.transactions, {
                from: sampleTokenLaunch.address,
                to: consumerVault.address,
                op: UserVaultOps.balanceUpdate,
                success: true,
            });
            printTxGasStats("Balance update (wl refund) transaction: ", wlRefundRequestTx);

            const wlRefundConfirmationTx = findTransactionRequired(wlRefundResult.transactions, {
                from: consumerVault.address,
                to: sampleTokenLaunch.address,
                op: TokensLaunchOps.refundConfirmation,
                success: true,
            });
            const withdrawConfirmationForwardFee = printTxGasStats("Whitelist refund confirmation transaction: ", wlRefundConfirmationTx);

            const consumerVaultStateAfterWlRef = await consumerVault.getVaultData();
            const saleMoneyFlowAfterWlRef = await sampleTokenLaunch.getSaleMoneyFlow();
            const tokenLaunchInnerDataAfterWlRef = await sampleTokenLaunch.getInnerData();
            const { purified, opn } = validateValue(valueToWithdraw, 0n);

            const refundGasConsumption = refundCost(
                refundRequestComputeFee,
                balanceUpdateCost,
                computeFwdFees(msgPrices, 1n, 739n),
                withdrawConfirmationForwardFee,
            );
            console.log(`Total refund transaction cost: ${refundGasConsumption} (${fromNano(refundGasConsumption)} TON)`);

            const contractBalanceAfter = tokenLaunchContractInstance.balance;
            // These tests are able to guarantee, that refund system operating the correct way (pay attention to its mechanics, and you'll understand why ;))
            expect(consumerVaultStateAfterWlRef.wlTonBalance).toEqual(0n);
            expect(saleMoneyFlowBeforeRefunds.totalTonsCollected).toEqual(saleMoneyFlowAfterWlRef.totalTonsCollected + valueToWithdraw);
            expect(contractBalanceAfter).toBeGreaterThanOrEqual(contractBalanceBefore - purified);
            expect(tokenLaunchInnerDataAfterWlRef.operationalNeeds).toEqual(tokenLaunchInnerDataBeforeRefunds.operationalNeeds + opn);


            const pubRefundResult = await sampleTokenLaunch.sendRefundRequest({
                    queryId: 4n,
                    value: toNano("0.05"),
                    via: consumer.getSender()
                },
                BalanceUpdateMode.PublicWithdrawal
            );
            expect(pubRefundResult.transactions).toHaveTransaction({
                from: consumerVault.address,
                to: sampleTokenLaunch.address,
                op: TokensLaunchOps.refundConfirmation,
                success: true,
            });
            const drainedVaultData = await consumerVault.getVaultData();
            assert(
                !(drainedVaultData.wlTonBalance
                    && drainedVaultData.publicTonBalance
                    && drainedVaultData.jettonBalance),
                "must be drained"
            );

            await blockchain.loadFrom(stateBeforeRefunds); // TODO now test out total refund
        });
    });
});
import {
    collectCellStats, computedGeneric, computeFwdFees, getGasPrices, computeGasFee,
    FullFees, GasPrices, computeFwdFeesVerbose, getMsgPrices, calcStorageFee,
    MsgPrices, printTxsLogs, StorageStats, getStoragePrices, StorageValue,
} from "./utils";
import {
    TokensLaunchOps, getAmountOut, jettonFromNano, validateValue, getQueryId,
    BASECHAIN, CoreOps, LaunchConfigV2A, UserVaultOps, BalanceUpdateMode,
} from "starton-periphery";
import { findTransactionRequired, randomAddress } from "@ton/test-utils";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { TokenLaunchV2A } from "../wrappers/TokenLaunchV2A";
import { UserVaultV2A } from "../wrappers/UserVaultV2A";
import { JettonMaster } from "../wrappers/JettonMaster";
import { JettonWallet } from "../wrappers/JettonWallet";
import { JettonOps } from "../wrappers/JettonConstants";
import { LaunchParams } from "../wrappers/types";
import { CoreV2A } from "../wrappers/CoreV2A";
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

/* TODO
    1. At some reason on-chain state always more on 102 bits that our off-chain calculation
    2. For all types of buys it is necessary to add contract balance validation to make sure we are not accounting non-existent TONs on contract's balance
*/

const MAINNET_MOCK = !!process.env.MAINNET_MOCK;
const PRINT_TX_LOGS = !!process.env.PRINT_TX_LOGS;

describe("V2A", () => {
    let coreCode = new Cell();
    let core: SandboxContract<CoreV2A>;

    let tokenLaunchCode = new Cell();
    let sampleTokenLaunch: SandboxContract<TokenLaunchV2A>;

    let userVaultCode = new Cell();
    let consumerVault: SandboxContract<UserVaultV2A>;

    let jettonMasterCode = new Cell();
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

    const JETTON_MIN_TRANSFER_FEE = 31000000n;
    const SIMPLE_TRANSFER_FEE = 6000000n;
    const ONE_MONTH = 30 * 24 * 3600;
    const TWO_MONTHS = 60 * 24 * 3600;
    let coreStorageStats: StorageStats;
    let tokenLaunchStorageStats: StorageStats;
    let userVaultStorageStats: StorageStats;
    let jettonMinterStorageStats: StorageStats;

    // Custom values
    //
    let launchConfig: LaunchConfigV2A;
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

    const precomputedRefundCost = 29648893n;
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
            compile("CoreV2A"),
            compile("TokenLaunchV2A"),
            compile("UserVaultV2A"),
            compile("JettonMaster"),
            compile("JettonWallet")
        ]);
        console.info("contracts compiled yaay^^");
        coreStorageStats = new StorageStats(0n, 0n); // TODO Fill in
        userVaultStorageStats = new StorageStats(5092n, 17n);
        tokenLaunchStorageStats = new StorageStats(44921n, 113n);

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
        const treasuryTraits = { balance: toNano("1000"), resetBalanceIfZero: true };
        chief = await blockchain.treasury("chief", treasuryTraits);
        creator = await blockchain.treasury("creator", treasuryTraits);
        consumer = await blockchain.treasury("consumer", treasuryTraits);


        const ONE_HOUR_MS = 3600 * 1000;
        launchConfig = {
            minTonForSaleSuccess: toNano("100"),
            tonLimitForWlRound: toNano("100"), // Seems correct
            penny: toNano("1"),

            jetWlLimitPct: 30000,
            jetPubLimitPct: 30000,
            jetDexSharePct: 25000,

            creatorRoundDurationMs: ONE_HOUR_MS,
            wlRoundDurationMs: ONE_HOUR_MS,
            pubRoundDurationMs: ONE_HOUR_MS,
        };
        // Stuff, related to core
        core = blockchain.openContract(
            CoreV2A.createFromState(
                {
                    chief: chief.address,
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
        sampleTokenLaunch = blockchain.openContract(
            TokenLaunchV2A.createFromState({
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
        consumerVault = blockchain.openContract(
            UserVaultV2A.createFromState({
                owner: consumer.address,
                tokenLaunch: sampleTokenLaunch.address
            }, userVaultCode)
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

        forwardStateInitOverhead = (prices, stats) => computeFwdFees(prices, stats.cells, stats.bits) - prices.lumpPrice;

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
            const { bodyCell, tokenLaunchStateInit } = CoreV2A.tokenCreationMessage(
                creator.address, chief.address, sampleLaunchParams, code, launchConfig
            );
            const loadedTokenLaunchStateInit = TokenLaunchV2A.buildState(
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
        test("new launch creation through core", async () => {
            const createLaunchResult = await core.sendCreateLaunch(
                {
                    via: creator.getSender(),
                    value: toNano("10") + launchConfig.penny,
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
        test("creator can buy his own tokens out", async () => {
            blockchain.now = sampleLaunchStartTime + 1;

            const value = toNano("0.5");
            const gasPrices = getGasPrices(blockchain.config, BASECHAIN);
            const expectedFee = computeGasFee(gasPrices, 13552n); // Computed by printTxGasStats later
            const tokenLaunchConfigBefore = await sampleTokenLaunch.getConfig();

            const expectedCreatorBalance = TokenLaunchV2A.getCreatorAmountOut(
                expectedFee, value,
                BigInt(launchConfig.jetWlLimitPct) * sampleLaunchParams.totalSupply / TokenLaunchV2A.PERCENTAGE_DENOMINATOR,
                launchConfig.tonLimitForWlRound
            );
            const buyoutTransactionResult = await sampleTokenLaunch.sendCreatorBuyout({
                via: creator.getSender(), value, queryId: 0n
            });

            const buyoutTx = findTransactionRequired(buyoutTransactionResult.transactions, {
                from: creator.address,
                on: sampleTokenLaunch.address,
                op: TokensLaunchOps.creatorBuyout,
                success: true,
            });
            printTxGasStats("Creator buyout transaction:", buyoutTx);

            const tokenLaunchConfigAfter = await sampleTokenLaunch.getConfig();
            const tokenLaunchState = await sampleTokenLaunch.getSaleMoneyFlow();

            assert(expectedCreatorBalance === tokenLaunchState.creatorFutJetBalance);
            assert(tokenLaunchConfigBefore.creatorFutJetLeft === tokenLaunchState.creatorFutJetBalance + tokenLaunchConfigAfter.creatorFutJetLeft);

            /* You may think, that I forgot about `expect`s here, and it would be better to use it for checks
            But, ironically, when comparison is falsy, instead of canonical equality error -
            you'll get something like (can't serialize Bigint <anonymous>).
            Lol it doesn't even tell source of this error, so,
            I'll gently leave it here especially for the particularly sophisticated masochist:

            expect(expectedCreatorBalance).toEqual(tokenLaunchState.creatorFutJetBalance + 1n); */
        });
        test.skip("loaded user vault state specs", async () => {
            const loadedUserVaultState = UserVaultV2A.buildState({
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
            blockchain.now = sampleLaunchStartTime + launchConfig.creatorRoundDurationMs + 1;
            const totalPurchaseValue = toNano("50");
            const strangerWlPurchaseTry = await sampleTokenLaunch.sendWhitelistPurchase({
                queryId: 123123123n,
                value: totalPurchaseValue,
                via: consumer.getSender()
            });
            expect(strangerWlPurchaseTry.transactions).toHaveTransaction({
                op: TokensLaunchOps.wlPurchase,
                success: false,
                exitCode: 400
            });
            const wlPurchaseResult = await sampleTokenLaunch.sendWhitelistPurchase({
                queryId: BigInt(getQueryId()),
                value: totalPurchaseValue,
                via: consumer.getSender()
            });
            const wlPurchaseTx = findTransactionRequired(wlPurchaseResult.transactions, {
                op: TokensLaunchOps.wlPurchase,
                success: true
            });
            const wlPurchaseRequestComputeFee = printTxGasStats("Whitelist purchase request transaction: ", wlPurchaseTx);
            const totalFee = wlPurchaseRequestComputeFee + balanceUpdateCost;
            const { purified, opn } = validateValue(totalPurchaseValue, totalFee);

            const consumerValurData = await consumerVault.getVaultData();
            assert(purified <= consumerValurData.wlTonBalance!, "expected precomputed value to be equal to actual one/bit less than it");
        });
        test("public buy works the proper way ", async () => {
            blockchain.now = sampleLaunchStartTime + launchConfig.creatorRoundDurationMs + launchConfig.wlRoundDurationMs + 1;
            const secondPublicBuyer = await blockchain.treasury("public_buyer_2");
            const [firstPublicBuyerVault, secondPublicBuyerVault] = await Promise.all(
                [consumer, secondPublicBuyer].map((buyer) => {
                    return blockchain.openContract(
                        UserVaultV2A.createFromState({
                            owner: buyer.address,
                            tokenLaunch: sampleTokenLaunch.address
                        }, userVaultCode)
                    );
                })
            );
            const totalPurchaseValue = toNano("50");

            const firstPublicBuyResult = await sampleTokenLaunch.sendPublicPurchase({
                queryId: 1n,
                value: totalPurchaseValue,
                via: consumer.getSender()
            });

            const moneyFlowAfterFirstPublicBuy = await sampleTokenLaunch.getSaleMoneyFlow();
            const secondPublicBuyResult = await sampleTokenLaunch.sendPublicPurchase({
                queryId: 2n,
                value: totalPurchaseValue,
                via: secondPublicBuyer.getSender()
            });
            // Opn transfer to chief, it works well and doesn't account any extra value, I think later I will show it in explicit manner here TODO
            expect(secondPublicBuyResult.transactions).toHaveTransaction({
                body: beginCell().storeUint(0, 32).storeBuffer(Buffer.from("meow")).endCell()
            });

            const publicBuyRequest = findTransactionRequired(firstPublicBuyResult.transactions, {
                on: sampleTokenLaunch.address,
                op: TokensLaunchOps.publicPurchase,
                success: true
            });
            const publicBuyRequestComputeFees = printTxGasStats("Public purchase request transaction: ", publicBuyRequest);
            const balanceUpdatePub = findTransactionRequired(firstPublicBuyResult.transactions, {
                on: firstPublicBuyerVault.address,
                op: UserVaultOps.balanceUpdate,
                success: true
            });
            printTxGasStats("Balance update (public purchase) transaction: ", balanceUpdatePub);
            const publicBuyFee = publicBuyRequestComputeFees + balanceUpdateCost;
            console.log(`Precomputed public buy total fee is equal to ${publicBuyFee} (${fromNano(publicBuyFee)} TON)`);
            const { purified, opn } = validateValue(totalPurchaseValue, publicBuyFee);
            const amountOut = getAmountOut(
                purified,
                moneyFlowAfterFirstPublicBuy.syntheticTonReserve,
                moneyFlowAfterFirstPublicBuy.syntheticJetReserve
            );

            const [firstPublicBuyerVaultData, secondPublicBuyerVaultData] = await Promise.all(
                [firstPublicBuyerVault, secondPublicBuyerVault].map((buyer) => buyer.getVaultData())
            );
            console.log(`tokens in vault: ${jettonFromNano(secondPublicBuyerVaultData.jettonBalance!)}, expected: ${jettonFromNano(amountOut)}`);
            expect(secondPublicBuyerVaultData.jettonBalance!).toBeGreaterThanOrEqual(amountOut);
            expect(firstPublicBuyerVaultData.jettonBalance!).toBeGreaterThan(secondPublicBuyerVaultData.jettonBalance!);
        });
        test("refunds work good (at this moment you may get tired from this typical names)", async () => {
            // At this point we have a guy called consumer, that have some wl goods and public goods in his vault
            // We'll test public and wl refunds one by one, reset state and test global refund ^^
            const stateBeforeRefunds = blockchain.snapshot();
            const tokenLaunchContractInstance = await blockchain.getContract(sampleTokenLaunch.address);
            const contractBalanceBefore = tokenLaunchContractInstance.balance;
            console.log(`Token launch balance before refunds: ${tokenLaunchContractInstance.balance} (${fromNano(tokenLaunchContractInstance.balance)} TON)`);

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
                    value: toNano("0.1"),
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
                !(
                    drainedVaultData.wlTonBalance
                    || drainedVaultData.publicTonBalance
                    || drainedVaultData.jettonBalance
                ),
                "must be drained"
            );
            await blockchain.loadFrom(stateBeforeRefunds);
            const restoredVaultData = await consumerVault.getVaultData();
            assert(
                restoredVaultData.wlTonBalance
                && restoredVaultData.publicTonBalance
                && restoredVaultData.jettonBalance,
                "must be full"
            );
            const totalRefundResult = await sampleTokenLaunch.sendRefundRequest({
                    queryId: 4n,
                    value: toNano("0.05"),
                    via: consumer.getSender()
                },
                BalanceUpdateMode.TotalWithdrawal
            );
            expect(totalRefundResult.transactions).toHaveTransaction({
                op: TokensLaunchOps.refundConfirmation,
                from: consumerVault.address,
                on: sampleTokenLaunch.address,
                success: true
            });
            expect(totalRefundResult.transactions).toHaveTransaction({
                op: 0x0,
                from: sampleTokenLaunch.address,
                on: consumer.address,
                success: true
            });
            const drainedVaultData_ = await consumerVault.getVaultData();
            assert(
                !(
                    drainedVaultData_.wlTonBalance
                    || drainedVaultData_.publicTonBalance
                    || drainedVaultData_.jettonBalance
                ),
                "must be drained again"
            );
            // Finally restore the state before refunds as we'll need to test claims
            await blockchain.loadFrom(stateBeforeRefunds);
        });
        test("deployment works properly", async () => {
            blockchain.now = sampleLaunchStartTime + launchConfig.creatorRoundDurationMs + launchConfig.wlRoundDurationMs + launchConfig.pubRoundDurationMs + 1;

            const launchContract = await blockchain.getContract(sampleTokenLaunch.address);
            const state = await sampleTokenLaunch.getSaleMoneyFlow();
            const inner = await sampleTokenLaunch.getInnerData();

            console.log(`${state.totalTonsCollected + inner.operationalNeeds} | ${launchContract.balance} | ${launchContract.balance - (state.totalTonsCollected + inner.operationalNeeds)}`);
            console.log(await sampleTokenLaunch.getSaleMoneyFlow())
            const jettonDeploymentRes = await sampleTokenLaunch.sendDeployJetton({
                via: chief.getSender(),
                queryId: 1n,
                value: toNano("0.05") // Must be free actually (in my dreams only)
            });
            const jettonDeploymentRequestTx = findTransactionRequired(jettonDeploymentRes.transactions, {
                op: TokensLaunchOps.deployJetton,
                success: true
            });
            printTxGasStats("Jetton deployment request transaction ", jettonDeploymentRequestTx);
            const jettonMintRequestTx = findTransactionRequired(jettonDeploymentRes.transactions, {
                op: JettonOps.Mint,
                success: true
            });
            printTxGasStats("Jetton mint request transaction ", jettonMintRequestTx);
            const mintedAmountTransferAcceptanceTx = findTransactionRequired(jettonDeploymentRes.transactions, {
                op: JettonOps.InternalTransfer,
                success: true,
            });
            printTxGasStats("Jetton transfer acceptance request transaction ", mintedAmountTransferAcceptanceTx);

        });
    });
});
import {
    collectCellStats, computedGeneric, computeFwdFees, getGasPrices, computeGasFee,
    FullFees, GasPrices, computeFwdFeesVerbose, getMsgPrices, calcStorageFee,
    MsgPrices, printTxsLogs, StorageStats, getStoragePrices, StorageValue,
} from "./utils";
import { findTransactionRequired, randomAddress } from "@ton/test-utils";
import {
    UTIL_JET_SEND_MODE_SIZE, UtilJettonsEnrollmentMode, TokensLaunchOps,
    BASECHAIN, CoreOps, LaunchConfigV2A, UserVaultOps, validateValue,
    Coins, getAmountOut, jettonFromNano, BalanceUpdateMode,
} from "starton-periphery";
import { TokenLaunchV2A } from "../wrappers/TokenLaunchv2A";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { UserVaultV2A } from "../wrappers/UserVaultV2A";
import { JettonMaster } from "../wrappers/JettonMaster";
import { JettonWallet } from "../wrappers/JettonWallet";
import { JettonOps } from "../wrappers/JettonConstants";
import { CoreV2A } from "../wrappers/CoreV2A";
import { LaunchParams } from "../wrappers/types";
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

describe.skip("Launchpad V2A", () => {
    let coreCode = new Cell();
    let core: SandboxContract<CoreV2A>;

    let tokenLaunchCode = new Cell();
    let sampleTokenLaunch: SandboxContract<TokenLaunchV2A>;

    let userVaultCode = new Cell();
    let userVault: SandboxContract<UserVaultV2A>;

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

    const precomputedBalanceUpdateCost = 7934994n;
    let balanceUpdateCost: (
        balanceUpdateForwardFee: bigint,
        userVaultStateInitOverhead: bigint,
        balanceUpdateComputeFee: bigint,
        userVaultMinStorageFee: bigint
    ) => bigint;

    const precomputedWlPurchaseCost = 84614194n;
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
            compile("Core"),
            compile("TokenLaunch"),
            compile("UserVault"),
            compile("CommonJettonMaster"),
            compile("CommonJettonWallet")
        ]);
        console.info("contracts compiled yaay^^");
        coreStorageStats = new StorageStats(0n, 0n); // TODO Fill in
        userVaultStorageStats = new StorageStats(5956n, 19n);
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
        launchConfig = {
            minTonForSaleSuccess: 0n,
            tonLimitForWlRound: toNano("1000"), // Seems correct
            penny: toNano("1"),

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
        coreUtilityJettonWallet = blockchain.openContract(JettonWallet.createFromConfig({
                ownerAddress: core.address,
                jettonMasterAddress: utilityJettonMaster.address
            }, jettonWalletCode)
        );

        // As we determine it in dynamic manner - the first enrollment of utility tokens is whole `utilJetRewardAmount`
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

        balanceUpdateCost = (
            balanceUpdateMsgForwardFee: bigint, userVaultStateInitOverhead: bigint,
            balanceUpdateComputeFee: bigint, userVaultMinStorageFee: bigint
        ) => {
            return balanceUpdateMsgForwardFee
                + userVaultStateInitOverhead
                + balanceUpdateComputeFee
                + userVaultMinStorageFee;
        };
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
        }
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
                creator.address, chief.address, utilityJettonMaster.address,
                sampleLaunchParams, code, launchConfig
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

            const value = toNano("0.5");
            const gasPrices = getGasPrices(blockchain.config, BASECHAIN);
            const expectedFee = computeGasFee(gasPrices, 14561n); // Computed by printTxGasStats later

            const mockedCreatorPrice = TokenLaunchV2A.getCreatorAmountOut(
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
                success: true
            });
            printTxGasStats("Creator buyout transaction:", buyoutTx);

            const tokenLaunchState = await sampleTokenLaunch.getSaleMoneyFlow();
            expect(mockedCreatorPrice).toEqual(tokenLaunchState.creatorFutJetBalance);
        });
        // TODO wrong-time check, wrong sum refund
        test.skip("whitelist purchase unavailable until the specified time", async () => {

        });
        test("loaded user vault state specs", async () => {
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

        });
        test("public buy works the proper way ", async () => {
            blockchain.now = sampleLaunchStartTime + 1 + launchConfig.creatorRoundDurationMs + launchConfig.wlRoundDurationMs;
            const secondPublicBuyer = await blockchain.treasury("public_buyer_2");

            const totalPurchaseValue = toNano("1");
            const firstPublicBuyResult = await sampleTokenLaunch.sendPublicBuy({
                queryId: 1n,
                value: totalPurchaseValue,
                via: consumer.getSender()
            });
            const moneyFlowAfterFristPublicBuy = await sampleTokenLaunch.getSaleMoneyFlow();
            await sampleTokenLaunch.sendPublicBuy({
                queryId: 2n,
                value: totalPurchaseValue,
                via: secondPublicBuyer.getSender()
            });

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
            const publicBuyFee = publicBuyRequestComputeFees + precomputedBalanceUpdateCost;
            const { purified, opn } = validateValue(totalPurchaseValue, publicBuyFee);
            const amountOut = getAmountOut(
                purified,
                moneyFlowAfterFristPublicBuy.syntheticTonReserve,
                moneyFlowAfterFristPublicBuy.syntheticJetReserve
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
            console.log(`Token launch balance before refunds: ${tokenLaunchContractInstance.balance} (${fromNano(tokenLaunchContractInstance.balance)})`);
            const consumerVault = blockchain.openContract(
                UserVaultV2A.createFromState({
                    owner: consumer.address,
                    tokenLaunch: sampleTokenLaunch.address
                }, userVaultCode)
            );
            const saleMoneyFlowBeforeRefunds = await sampleTokenLaunch.getSaleMoneyFlow();
            const consumerVaultStateBeforeRefunds = await consumerVault.getVaultData();
            const valueToWithdraw = consumerVaultStateBeforeRefunds.wlTonBalance!;
            console.log(`Wl value to withdraw: ${valueToWithdraw} (${fromNano(valueToWithdraw)} TON)`);
            assert(consumerVaultStateBeforeRefunds.jettonBalance
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
            const wlRefundRequestTx = findTransactionRequired(wlRefundResult.transactions, {
                from: sampleTokenLaunch.address,
                to: consumerVault.address,
                success: true,
            });
            const wlRefundRequestComputeFee = printTxGasStats("Whitelist refund request gas costs: ", wlRefundRequestTx);
            const wlRefundConfirmationTx = findTransactionRequired(wlRefundResult.transactions, {
                from: consumerVault.address,
                to: sampleTokenLaunch.address,
                success: true,
            });
            const withdrawConfirmationForwardFee = printTxGasStats("Whitelist refund confirmation gas costs: ", wlRefundConfirmationTx);
            const consumerVaultStateAfterWlRef = await consumerVault.getVaultData();
            const saleMoneyFlowAfterWlRef = await sampleTokenLaunch.getSaleMoneyFlow();

            const refundGasConsumption = refundCost(
                wlRefundRequestComputeFee,
                precomputedBalanceUpdateCost,
                computeFwdFees(msgPrices, 1n, 739n),
                withdrawConfirmationForwardFee,
            );
            const { purified, opn } = validateValue(valueToWithdraw, refundGasConsumption);
            console.log(`Token launch balance after refunds: ${tokenLaunchContractInstance.balance} (${fromNano(tokenLaunchContractInstance.balance)})`);
        }); // creator stage remainings goes to 3rd
    });
});
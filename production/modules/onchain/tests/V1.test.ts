import {
    MsgPrices, printTxsLogs, StorageStats, getStoragePrices, StorageValue, formatValue,
    collectCellStats, computedGeneric, computeFwdFees, getGasPrices, computeGasFee,
    FullFees, GasPrices, computeFwdFeesVerbose, getMsgPrices, computeStorageFee,
} from "./utils";
import {
    BalanceUpdateMode, TokensLaunchOps, LaunchConfigV1, UserVaultOps, CoreOps, GlobalVersions,
    JETTON_MIN_TRANSFER_FEE, MAX_WL_ROUND_TON_LIMIT, PERCENTAGE_DENOMINATOR, BASECHAIN,
    getPublicAmountOut, getApproximateClaimAmount, packLaunchConfigV1ToCell, toPct,
    validateValueMock, jettonFromNano, getCreatorAmountOut, getQueryId,
    PURCHASE_FEE_PERCENT, REFERRAL_PAYMENT_PERCENT, REFUND_FEE_PERCENT, getWhitelistAmountOut, getAmountOut, fees,
} from "starton-periphery";
import { findTransactionRequired, randomAddress } from "@ton/test-utils";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { TokenLaunchV1 } from "../wrappers/TokenLaunchV1";
import { JettonMaster } from "../wrappers/JettonMaster";
import { JettonWallet } from "../wrappers/JettonWallet";
import { JettonOps } from "../wrappers/JettonConstants";
import { UserVaultV1 } from "../wrappers/UserVaultV1";
import { LaunchParams } from "../wrappers/types";
import { CoreV1 } from "../wrappers/CoreV1";
import { ok as assert } from "node:assert";
import { compile } from "@ton/blueprint";
import { TonClient4 } from "@ton/ton";
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

/* To find out:
    1. At some reason on-chain state always more on 102 bits that our off-chain calculation
*/

const MAINNET_MOCK = !!process.env.MAINNET_MOCK;
const PRINT_TX_LOGS = !!process.env.PRINT_TX_LOGS;

describe("V1", () => {
    let coreCode = new Cell();
    let core: SandboxContract<CoreV1>;

    let tokenLaunchCode = new Cell();
    let sampleTokenLaunch: SandboxContract<TokenLaunchV1>;

    let userVaultCode = new Cell();
    let consumerVault: SandboxContract<UserVaultV1>;

    let jettonMasterCode = new Cell();
    let derivedJettonMaster: SandboxContract<JettonMaster>;

    let jettonWalletCode = new Cell();
    let tokenLaunchDerivedJettonWallet: SandboxContract<JettonWallet>;

    let blockchain: Blockchain;
    let chief: SandboxContract<TreasuryContract>;
    let creator: SandboxContract<TreasuryContract>;
    let consumer: SandboxContract<TreasuryContract>;
    let msgPrices: MsgPrices;
    let gasPrices: GasPrices;
    let storagePrices: StorageValue;

    const SIMPLE_TRANSFER_FEE = 6000000n;
    const ONE_MONTH = 30 * 24 * 3600;
    const TWO_MONTHS = 60 * 24 * 3600;
    let coreStorageStats: StorageStats;
    let tokenLaunchStorageStats: StorageStats;
    let userVaultStorageStats: StorageStats;
    let jettonMasterStorageStats: StorageStats;

    // Custom values
    let launchConfig: LaunchConfigV1;
    let sampleLaunchParams: LaunchParams;
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
        coreStorageStats = new StorageStats(50500n, 150n);
        userVaultStorageStats = new StorageStats(5250n, 18n);
        tokenLaunchStorageStats = new StorageStats(50000n, 150n);
        jettonMasterStorageStats = new StorageStats(20000n, 40n);

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

        sampleLaunchStartTime = Math.round(Date.now() / 1000) + 3600;
        sampleLaunchParams = {
            startTime: sampleLaunchStartTime,
            totalSupply: toNano("1000000"),
            metadata: { uri: "http://another_shitcoin.meow" },
            platformSharePct: 1500
        };

        const treasuryTraits = { balance: toNano("1000"), resetBalanceIfZero: true };
        chief = await blockchain.treasury("chief", treasuryTraits); // Me btw
        creator = await blockchain.treasury("creator", treasuryTraits);
        consumer = await blockchain.treasury("consumer", treasuryTraits);


        const ONE_HOUR_SEC = 3600;
        launchConfig = {
            minTonForSaleSuccess: toNano("100"),
            tonLimitForWlRound: toNano("100"),
            penny: toNano("1"),

            // Warning! In case of fractional/odd shares contract's math may have slight calc inaccuracy
            jetWlLimitPct: toPct(18),
            jetPubLimitPct: toPct(38),
            jetDexSharePct: toPct(20),

            creatorRoundDurationSec: ONE_HOUR_SEC,
            wlRoundDurationSec: ONE_HOUR_SEC,
            pubRoundDurationSec: ONE_HOUR_SEC,
        };
        core = blockchain.openContract(
            CoreV1.createFromState(
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
        consumerVault = blockchain.openContract(
            UserVaultV1.createFromState({
                owner: consumer.address,
                tokenLaunch: sampleTokenLaunch.address
            }, userVaultCode)
        );
        derivedJettonMaster = blockchain.openContract(
            JettonMaster.createFromConfig({
                admin: sampleTokenLaunch.address,
                jettonContent: sampleLaunchParams.metadata,
                supply: 0n,
                walletCode: jettonWalletCode
            }, jettonMasterCode)
        );
        tokenLaunchDerivedJettonWallet = blockchain.openContract(
            JettonWallet.createFromConfig({
                jettonMasterAddress: derivedJettonMaster.address,
                ownerAddress: sampleTokenLaunch.address
            }, jettonWalletCode)
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
            computeStorageFee(storagePrices, userVaultStorageStats, BigInt(ONE_MONTH))
        );
        console.log(`Balance update total cost: ${fromNano(balanceUpdateCost)} (${balanceUpdateCost})`);
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
            if (PRINT_TX_LOGS) printTxsLogs(deployResult.transactions, "CoreV1 deployment VM logs");

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
        test("core state specs", async () => {
            const smc = await blockchain.getContract(core.address);
            assert(smc.accountState, "Can't access core account state");
            // Runtime doesn't see assert here lol
            if (smc.accountState.type !== "active") throw new Error("CoreV1 account is not active");
            assert(smc.account.account, "Can't access core account!");

            console.log(
                "CoreV1 ~ storage stats (dictionary is empty):",
                smc.account.account.storageStats.used
            );
            const stateCell = beginCell().store(storeStateInit(smc.accountState.state)).endCell();
            console.log("CoreV1 state stats:", collectCellStats(stateCell, []));
        });
        test("token creation fees static measurements", async () => {
            // Measure stateinit forwarding
            const code = {
                tokenLaunch: tokenLaunchCode,
                userVault: userVaultCode,
                jettonMaster: jettonMasterCode,
                jettonWallet: jettonWalletCode,

            };
            const { bodyCell, tokenLaunchStateInit } = CoreV1.tokenCreationMessage(
                creator.address, chief.address, sampleLaunchParams, code, launchConfig
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
        }, 20000);
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
                op: CoreOps.CreateLaunch,
                success: true
            });
            printTxGasStats("Token launch creation request to core transaction:", createLaunchTx);
            const deploymentTx = findTransactionRequired(createLaunchResult.transactions, {
                from: core.address,
                op: TokensLaunchOps.Init,
                deploy: true,
                success: true
            });
            printTxGasStats("New token launch deployment transaction:", deploymentTx);
            expect(createLaunchResult.transactions).toHaveTransaction({
                op: JettonOps.Excesses,
                from: core.address,
                success: true,
            });
            const { futJetDexAmount } = await sampleTokenLaunch.getConfig();
            assert(futJetDexAmount === sampleLaunchParams.totalSupply / 5n);
        }, 20000);
        test.skip("token launch on-chain state stats", async () => {
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
        test("core config updates correctly", async () => {
            const stateBefore = blockchain.snapshot();
            const newConfig = { ...launchConfig, minTonForSaleSuccess: toNano("666") };
            const configUpdateResult = await core.sendUpdateConfig({
                queryId: 0n,
                value: toNano("0.2"),
                via: chief.getSender()
            }, packLaunchConfigV1ToCell(newConfig));
            expect(configUpdateResult.transactions).toHaveTransaction({
                op: CoreOps.UpdateConfig,
                on: core.address,
                success: true
            });
            const currentConfig = await core.getLaunchConfig();
            assert(currentConfig.minTonForSaleSuccess === newConfig.minTonForSaleSuccess, "value must have been updated");
            await blockchain.loadFrom(stateBefore);
        });
        test("token launch creation with custom config", async () => {
            const stateBefore = blockchain.snapshot();
            const launchCreationResult = await core.sendCreateLaunch({
                    queryId: 0n,
                    value: toNano("5"),
                    via: creator.getSender()
                }, sampleLaunchParams,
                { ...launchConfig, minTonForSaleSuccess: toNano("666.666") }
            );
            expect(launchCreationResult.transactions).toHaveTransaction({
                op: TokensLaunchOps.Init,
                deploy: true,
                success: true
            });
            const customizedTokenLaunch = blockchain.openContract(
                TokenLaunchV1.createFromState({
                        creator: creator.address,
                        chief: chief.address,
                        launchParams: sampleLaunchParams,
                        code: {
                            tokenLaunch: tokenLaunchCode,
                            userVault: userVaultCode,
                            jettonMaster: jettonMasterCode,
                            jettonWallet: jettonWalletCode,

                        },
                        launchConfig: { ...launchConfig, minTonForSaleSuccess: toNano("666.666") }
                    },
                    tokenLaunchCode)
            );

            const configInsideLaunch = await customizedTokenLaunch.getConfig();
            assert(configInsideLaunch.minTonForSaleSuccess === toNano("666.666"));
            await blockchain.loadFrom(stateBefore);
        });
    });
    describe("token launch operations", () => {
        test("creator can buy his own tokens out", async () => {
            blockchain.now = sampleLaunchStartTime + 1;
            const launchContractInstance = await blockchain.getContract(sampleTokenLaunch.address);
            const contractBalanceBefore = launchContractInstance.balance;
            const tokenLaunchConfigBefore = await sampleTokenLaunch.getConfig();
            const valueLimitForCreator = tokenLaunchConfigBefore.creatorFutJetLeft * MAX_WL_ROUND_TON_LIMIT / tokenLaunchConfigBefore.creatorFutJetPriceReversed;
            console.log(`Creator round limits: ${jettonFromNano(tokenLaunchConfigBefore.creatorFutJetLeft)} jettons; ${fromNano(valueLimitForCreator)} TONs`);

            const value = toNano("30");
            const buyoutTransactionResult = await sampleTokenLaunch.sendCreatorBuyout({
                via: creator.getSender(), value, queryId: 0n
            });

            const buyoutTx = findTransactionRequired(buyoutTransactionResult.transactions, {
                from: creator.address,
                on: sampleTokenLaunch.address,
                op: TokensLaunchOps.CreatorBuyout,
                success: true,
            });
            const computeFee = printTxGasStats("Creator buyout transaction:", buyoutTx);
            const totalExpectedFee = computeFee + balanceUpdateCost;

            const tokenLaunchConfigAfter = await sampleTokenLaunch.getConfig();
            const tokenLaunchState = await sampleTokenLaunch.getMoneyFlows();
            const contractBalanceAfter = launchContractInstance.balance;

            // frustrating situation has arisen at the point of small difference between expected and actual balances difference
            // The only solution I really see here is to artificially low deposit figures
            const precomputedBalanceDifference = value - totalExpectedFee;
            const actualBalanceDifference = contractBalanceAfter - contractBalanceBefore;
            const balanceDiff = precomputedBalanceDifference - actualBalanceDifference;
            if (balanceDiff) {
                console.warn(`actual contract balance increased less than expected on ${fromNano(balanceDiff)} (${balanceDiff}): `);
                console.warn(`actual difference: ${fromNano(actualBalanceDifference)} (${actualBalanceDifference}) | expected difference: ${fromNano(precomputedBalanceDifference)} (${precomputedBalanceDifference})`);
            }

            console.log(`Min ton for sale success: ${launchConfig.minTonForSaleSuccess}`);
            const expectedCreatorBalance = getCreatorAmountOut(GlobalVersions.V1, value, {
                    wlRoundFutJetLimit: BigInt(launchConfig.jetWlLimitPct) * sampleLaunchParams.totalSupply / PERCENTAGE_DENOMINATOR,
                    minTonForSaleSuccess: launchConfig.minTonForSaleSuccess
                },
                totalExpectedFee
            );
            assert(expectedCreatorBalance === tokenLaunchState.creatorFutJetBalance, `${jettonFromNano(expectedCreatorBalance)} vs ${jettonFromNano(tokenLaunchState.creatorFutJetBalance)}`);
            assert(tokenLaunchConfigBefore.creatorFutJetLeft === tokenLaunchState.creatorFutJetBalance + tokenLaunchConfigAfter.creatorFutJetLeft);

            /* You may think, that I forgot about `expect`s here, and it would be better to use it for checks
            But, ironically, when comparison is falsy, instead of canonical equality error -
            you'll get something like (can't serialize Bigint <anonymous>).
            Lol it doesn't even tell source of this error, so,
            I'll gently leave it here especially for the particularly sophisticated masochist:

            expect(expectedCreatorBalance).toEqual(tokenLaunchState.creatorFutJetBalance + 1n); */
        }, 20000);
        test("creator corner buy", async () => {
            const tokenLaunchConfigBefore = await sampleTokenLaunch.getConfig();
            const jettonsLeftForCreator = tokenLaunchConfigBefore.creatorFutJetLeft;
            const valueLeftForCreator = jettonsLeftForCreator * MAX_WL_ROUND_TON_LIMIT / tokenLaunchConfigBefore.creatorFutJetPriceReversed;
            console.log(`Left for creator after 1st buyout ${jettonFromNano(jettonsLeftForCreator)} jettons; ${fromNano(valueLeftForCreator)} TONs`);


            const value = valueLeftForCreator * 2n;
            const buyoutTransactionResult = await sampleTokenLaunch.sendCreatorBuyout({
                via: creator.getSender(), value, queryId: 0n
            });

            expect(buyoutTransactionResult.transactions).toHaveTransaction({
                from: creator.address,
                on: sampleTokenLaunch.address,
                op: TokensLaunchOps.CreatorBuyout,
                success: true,
            });
            expect(buyoutTransactionResult.transactions).toHaveTransaction({
                from: sampleTokenLaunch.address,
                on: creator.address,
                op: JettonOps.Excesses,
                success: true,
                value: x => x! > valueLeftForCreator * 9n / 10n
            });
            const tokenLaunchConfigAfter = await sampleTokenLaunch.getConfig();
            assert(tokenLaunchConfigAfter.creatorFutJetLeft === 0n, `left: ${tokenLaunchConfigAfter.creatorFutJetLeft}`);
        }, 20000);
        test("creator can refund his share", async () => {
            const stateBeforeCreatorRefund = blockchain.snapshot();
            const tokenLaunchContractInstance = await blockchain.getContract(sampleTokenLaunch.address);

            const { creatorFutJetBalance, creatorFutJetPriceReversed } = await sampleTokenLaunch.getConfig();
            const { publicRoundEndTime } = await sampleTokenLaunch.getSaleTimings();
            blockchain.now = publicRoundEndTime + 1;

            const creatorTonsCollected = creatorFutJetBalance * MAX_WL_ROUND_TON_LIMIT / creatorFutJetPriceReversed;
            console.log(`Creator's ton share: ${fromNano(creatorTonsCollected)} (${creatorTonsCollected})`);

            const contractBalanceBefore = tokenLaunchContractInstance.balance;
            const refundResult = await sampleTokenLaunch.sendCreatorRefund({
                    queryId: 0n,
                    value: toNano("0.03"),
                    via: creator.getSender()
                },
            );
            const refundRequestTx = findTransactionRequired(refundResult.transactions, {
                from: creator.address,
                to: sampleTokenLaunch.address,
                op: TokensLaunchOps.CreatorRefund,
                success: true,
            });
            const contractBalanceAfter = tokenLaunchContractInstance.balance;
            const { purified } = validateValueMock(creatorTonsCollected, 0n, REFUND_FEE_PERCENT);
            const balanceDiff = (contractBalanceBefore - contractBalanceAfter) - purified;
            if (balanceDiff > 0) {
                console.warn(`Balance diff after creator's refund: onchain ${fromNano(contractBalanceBefore - contractBalanceAfter)}; offchain ${fromNano(purified)}`);
            }

            printTxGasStats("Creator refund request transaction: ", refundRequestTx);

            await blockchain.loadFrom(stateBeforeCreatorRefund);
        });
        test.skip("loaded user vault state specs", async () => {
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
        test("stranger can't buy on wl round", async () => {
            blockchain.now = sampleLaunchStartTime + launchConfig.creatorRoundDurationSec + 1;
            const strangerWlPurchaseTry = await sampleTokenLaunch.sendWhitelistPurchase({
                queryId: 123123123n,
                value: toNano("1"),
                via: consumer.getSender()
            });
            expect(strangerWlPurchaseTry.transactions).toHaveTransaction({
                op: TokensLaunchOps.WhitelistPurchase,
                success: false,
                exitCode: 400
            });
        }, 20000);
        test("high wl purchase operations pressure", async () => {
            const conf = { totalTons: 80, totalBuys: 5 };
            const wlBuyers = await Promise.all(
                Array.from({ length: conf.totalBuys }, (_, i) =>
                    blockchain.treasury(`wl_buyer_${i + 1}`, { balance: toNano("1000000") })
                )
            );
            for (let i = 0; i < conf.totalBuys; i++) {
                const res = await sampleTokenLaunch.sendWhitelistPurchase({
                    queryId: BigInt(getQueryId()),
                    value: toNano(conf.totalTons / conf.totalBuys),
                    via: wlBuyers[i].getSender(),
                });
                expect(res.transactions).toHaveTransaction({
                    op: TokensLaunchOps.WhitelistPurchase,
                    success: true
                });
                blockchain.now! += 10;
            }
        }, 20000);
        test("wl purchase works correctly", async () => {
            const [launchContractInstance, saleMoneyFlowBefore, innerDataBefore] = await Promise.all([
                blockchain.getContract(sampleTokenLaunch.address), sampleTokenLaunch.getMoneyFlows(), sampleTokenLaunch.getInnerData()
            ]);
            const contractBalanceBefore = launchContractInstance.balance;

            const totalPurchaseValue = toNano("10");
            const wlPurchaseResult = await sampleTokenLaunch.sendWhitelistPurchase({
                queryId: BigInt(getQueryId()),
                value: totalPurchaseValue,
                via: consumer.getSender()
            });
            const wlPurchaseTx = findTransactionRequired(wlPurchaseResult.transactions, {
                op: TokensLaunchOps.WhitelistPurchase,
                success: true
            });
            const wlPurchaseRequestComputeFee = printTxGasStats("Whitelist purchase request transaction: ", wlPurchaseTx);
            expect(wlPurchaseResult.transactions).toHaveTransaction({
                op: UserVaultOps.balanceUpdate,
                to: consumerVault.address,
                success: true
            });
            const totalFee = wlPurchaseRequestComputeFee + balanceUpdateCost;
            const { purified } = validateValueMock(totalPurchaseValue, totalFee, PURCHASE_FEE_PERCENT);
            console.log(`Precomputed wl buy total fee is equal to ${totalFee} (${fromNano(totalFee)} TON)`);

            const contractBalanceAfter = launchContractInstance.balance;
            const [consumerVaultDataAfter, saleMoneyFlowAfter, innerDataAfter] = await Promise.all([
                consumerVault.getVaultData(), sampleTokenLaunch.getMoneyFlows(), sampleTokenLaunch.getInnerData()
            ]);

            // Here we can be sure, that all the tons we had accounted really exists on contract's balance
            const totalTonsIncrease = saleMoneyFlowAfter.totalTonsCollected - saleMoneyFlowBefore.totalTonsCollected;
            const totalDifferenceAccounted = totalTonsIncrease + (innerDataAfter.operationalNeeds - innerDataBefore.operationalNeeds);
            const totalActualDifference = contractBalanceAfter - contractBalanceBefore;
            const divergence = totalDifferenceAccounted - totalActualDifference;

            if (divergence) console.warn(`\"dead\" tons (wl buy): ${fromNano(divergence)} (${divergence})`);
            // We commented that as we use referral fee in contract as main one
            // assert(purified <= consumerVaultDataAfter.wlTonBalance!, `${fromNano(purified)} vs ${fromNano(consumerVaultDataAfter.wlTonBalance!)}`);
            assert(
                totalTonsIncrease === consumerVaultDataAfter.wlTonBalance!,
                `${fromNano(totalTonsIncrease)} vs ${fromNano(consumerVaultDataAfter.wlTonBalance!)}`
            );
        }, 20000);
        test("wl purchase with referral works correctly", async () => {
            const [launchContractInstance, saleMoneyFlowBefore, innerDataBefore] = await Promise.all([
                blockchain.getContract(sampleTokenLaunch.address), sampleTokenLaunch.getMoneyFlows(), sampleTokenLaunch.getInnerData()
            ]);
            const contractBalanceBefore = launchContractInstance.balance;
            const consumerWithReferral = await blockchain.treasury("consumer_with_referral");
            const consumerWithReferralVault = blockchain.openContract(
                UserVaultV1.createFromState({
                    owner: consumerWithReferral.address,
                    tokenLaunch: sampleTokenLaunch.address
                }, userVaultCode)
            );
            const referral = await blockchain.treasury("referral");

            const totalPurchaseValue = toNano("10");
            const wlPurchaseResult = await sampleTokenLaunch.sendWhitelistPurchase({
                queryId: BigInt(getQueryId()),
                value: totalPurchaseValue,
                via: consumerWithReferral.getSender()
            }, referral.address);
            const wlPurchaseTx = findTransactionRequired(wlPurchaseResult.transactions, {
                op: TokensLaunchOps.WhitelistPurchase,
                success: true
            });
            const wlPurchaseRequestComputeFee = printTxGasStats("Whitelist purchase with referral request transaction: ", wlPurchaseTx);
            expect(wlPurchaseResult.transactions).toHaveTransaction({
                op: UserVaultOps.balanceUpdate,
                to: consumerWithReferralVault.address,
                success: true
            });

            const totalFee = wlPurchaseRequestComputeFee + balanceUpdateCost;
            const { purified } = validateValueMock(totalPurchaseValue, totalFee, PURCHASE_FEE_PERCENT);
            const purifiedWithoutReferralShare = purified * (100n - REFERRAL_PAYMENT_PERCENT) / 100n;

            // Referral payment should be there
            expect(wlPurchaseResult.transactions).toHaveTransaction({
                op: 0x0,
                to: referral.address,
                success: true,
                body: beginCell().storeUint(0, 32).storeStringTail("r").endCell(),
                // 4 as we spent some money on fee due to sending mode
                value: (v) => (v ?? 0n) > purified * (REFERRAL_PAYMENT_PERCENT - 1n) / 100n
            });

            console.log(`Precomputed wl buy with referral total fee is equal to ${totalFee} (${fromNano(totalFee)} TON)`);

            const contractBalanceAfter = launchContractInstance.balance;
            const [consumerWithReferralVaultDataAfter, saleMoneyFlowAfter, innerDataAfter] = await Promise.all([
                consumerWithReferralVault.getVaultData(), sampleTokenLaunch.getMoneyFlows(), sampleTokenLaunch.getInnerData()
            ]);

            // Here we can be sure, that all the tons we had accounted really exists on contract's balance
            const totalTonsIncrease = saleMoneyFlowAfter.totalTonsCollected - saleMoneyFlowBefore.totalTonsCollected;
            const totalDifferenceAccounted = totalTonsIncrease + (innerDataAfter.operationalNeeds - innerDataBefore.operationalNeeds);
            const totalActualDifference = contractBalanceAfter - contractBalanceBefore;
            const divergence = totalDifferenceAccounted - totalActualDifference;

            if (divergence) console.warn(`\"dead\" tons (wl buy): ${fromNano(divergence)} (${divergence})`);
            assert(purifiedWithoutReferralShare <= consumerWithReferralVaultDataAfter.wlTonBalance!, `${fromNano(purifiedWithoutReferralShare)} vs ${fromNano(consumerWithReferralVaultDataAfter.wlTonBalance!)}`);
            assert(
                totalTonsIncrease === consumerWithReferralVaultDataAfter.wlTonBalance!,
                `${fromNano(totalTonsIncrease)} vs ${fromNano(consumerWithReferralVaultDataAfter.wlTonBalance!)}`
            );
        }, 20000);
        test("wl refund case (balance consistency check)", async () => {
            // One refund case to verify correct release of locked value into the circulation of the whitelist round
            const randomWlBuyer = await blockchain.treasury(`wl_buyer_1`);
            const moneyFlowsBefore = await sampleTokenLaunch.getMoneyFlows();
            const innerDataBefore = await sampleTokenLaunch.getInnerData();
            const wlRefundResult = await sampleTokenLaunch.sendRefundRequest({
                    queryId: 0n,
                    value: toNano("0.03"),
                    via: randomWlBuyer.getSender()
                },
                BalanceUpdateMode.WhitelistWithdrawal
            );
            expect(wlRefundResult.transactions).toHaveTransaction({
                to: sampleTokenLaunch.address,
                op: TokensLaunchOps.RefundConfirmation,
                success: true,
            });
            const moneyFlowsAfter = await sampleTokenLaunch.getMoneyFlows();
            const innerDataAfter = await sampleTokenLaunch.getInnerData();

            assert(innerDataBefore.futJetInnerBalance < innerDataAfter.futJetInnerBalance,
                `${innerDataBefore.futJetInnerBalance} vs ${innerDataAfter.futJetInnerBalance}`);
            assert(moneyFlowsBefore.wlRoundTonInvestedTotal > moneyFlowsAfter.wlRoundTonInvestedTotal,
                `${moneyFlowsBefore.wlRoundTonInvestedTotal} vs ${moneyFlowsAfter.wlRoundTonInvestedTotal}`);
            assert(moneyFlowsBefore.syntheticTonReserve > moneyFlowsAfter.syntheticTonReserve,
                `${moneyFlowsBefore.syntheticTonReserve} vs ${moneyFlowsAfter.syntheticTonReserve}`);
        });
        test("wl limit cutoff works the proper way", async () => {
            const oldTimings = await sampleTokenLaunch.getSaleTimings();
            const totalPurchaseValue = toNano("35");
            const wlPurchaseResult = await sampleTokenLaunch.sendWhitelistPurchase({
                queryId: BigInt(getQueryId()),
                value: totalPurchaseValue,
                via: consumer.getSender()
            });
            expect(wlPurchaseResult.transactions).toHaveTransaction({
                op: TokensLaunchOps.WhitelistPurchase,
                success: true
            });
            expect(wlPurchaseResult.transactions).toHaveTransaction({
                op: UserVaultOps.balanceUpdate,
                to: consumerVault.address,
                success: true
            });
            // Excesses from user's value
            expect(wlPurchaseResult.transactions).toHaveTransaction({
                op: 0x0,
                to: consumer.address,
                success: true,
                body: beginCell().storeUint(0, 32).storeStringTail("shift!").endCell(),
                // value: (v) => (v ?? 0n) > toNano("3")
            });
            const newTimings = await sampleTokenLaunch.getSaleTimings();
            assert(newTimings.wlRoundEndTime < oldTimings.wlRoundEndTime, "smartcontract must shift timings");
        }, 20000);
        test("price shift balance comparison", async () => {
            blockchain.now = (await sampleTokenLaunch.getSaleTimings()).wlRoundEndTime + 1;

            const config = await sampleTokenLaunch.getConfig();
            const wlRoundPrice = Number(fromNano(config.wlRoundTonLimit)) / Number(jettonFromNano(config.wlRoundFutJetLimit));

            const value = toNano("5");
            const shiftPurchaseRes = await sampleTokenLaunch.sendPublicPurchase({
                queryId: 0n,
                value,
                via: consumer.getSender(),
            });
            expect(shiftPurchaseRes.transactions).toHaveTransaction({
                from: consumer.address,
                on: sampleTokenLaunch.address,
                op: TokensLaunchOps.PublicPurchase,
                success: true
            });
            const { jettonBalance } = await consumerVault.getVaultData();

            const puRoundPrice = Number(fromNano(value)) / Number(jettonFromNano(jettonBalance!));
            const priceIncreasePercent = ((puRoundPrice - wlRoundPrice) / wlRoundPrice) * 100;

            console.log(`Price shift percents change: ${priceIncreasePercent.toFixed(2)}% (${wlRoundPrice.toFixed(10)} -> ${puRoundPrice.toFixed(10)})`);
        });
        test("high public purchase pressure", async () => {
            const totalBuys = 50; // we can also set 100-200-300...
            const publicBuyers = await Promise.all(
                Array.from({ length: totalBuys }, (_, i) =>
                    blockchain.treasury(`pub_buyer_${i + 1}`, { balance: toNano("1000000") }))
            );
            const { pubRoundFutJetLimit } = await sampleTokenLaunch.getConfig();

            const value = toNano("10");
            const purchaseLogs = [];

            for (let i = 0; i < totalBuys; i++) {
                blockchain.now! += 5;
                await sampleTokenLaunch.sendPublicPurchase({
                    queryId: BigInt(i + 1),
                    value,
                    via: publicBuyers[i].getSender(),
                });

                const { publicRoundFutJetSold: futJetSoldAfterBuy } = await sampleTokenLaunch.getMoneyFlows();
                const ratio = Number(jettonFromNano(futJetSoldAfterBuy)) / Number(jettonFromNano(pubRoundFutJetLimit));
                purchaseLogs.push(`Jetton bought after ${i + 1} buy: ${(ratio * 100).toFixed(2)}%`);
            }

            const vaults = await Promise.all(
                publicBuyers.map((buyer) =>
                    blockchain.openContract(UserVaultV1.createFromState({
                        owner: buyer.address, tokenLaunch: sampleTokenLaunch.address,
                    }, userVaultCode))
                )
            );
            const vaultsData = await Promise.all(vaults.map((buyer) => buyer.getVaultData()));

            console.log(
                purchaseLogs.join("\n") +
                "\n\n" +
                vaultsData
                    .map((data, index) => `Public buyer #${index + 1} jettons after buy: ${jettonFromNano(data.jettonBalance!)}, price: ${Number(fromNano(value)) / Number(jettonFromNano(data.jettonBalance!))}`)
                    .join("\n")
            );
        }, 20000);
        test("public buys work the proper way", async () => {
            const secondPublicBuyer = await blockchain.treasury("public_buyer_2");
            const launchContractInstance = await blockchain.getContract(sampleTokenLaunch.address);
            const referral = await blockchain.treasury("referral");

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
            const configBefore = await sampleTokenLaunch.getConfig();
            const moneyFlowsBefore = await sampleTokenLaunch.getMoneyFlows();
            const totalPurchaseValue = toNano("50");
            const firstPublicPurchaseResult = await sampleTokenLaunch.sendPublicPurchase({
                queryId: 1n,
                value: totalPurchaseValue,
                via: consumer.getSender()
            }, referral.address);
            const [saleMoneyFlowAfterFirstPublicBuy, configAfter] = await Promise.all([sampleTokenLaunch.getMoneyFlows(), sampleTokenLaunch.getConfig()]);
            const wlRoundRemaining = getWhitelistAmountOut(configBefore.wlRoundTonLimit - moneyFlowsBefore.wlRoundTonInvestedTotal, configBefore.wlRoundTonLimit, configBefore.wlRoundFutJetLimit);
            assert(
                (configBefore.creatorFutJetLeft + configBefore.pubRoundFutJetLimit + wlRoundRemaining) === configAfter.pubRoundFutJetLimit,
                "creator's leftovers must flow to public round"
            );
            assert(configAfter.creatorFutJetLeft === 0n);
            const publicBuyRequest = findTransactionRequired(firstPublicPurchaseResult.transactions, {
                from: consumer.address,
                on: sampleTokenLaunch.address,
                op: TokensLaunchOps.PublicPurchase,
                success: true
            });
            const publicBuyRequestComputeFees = printTxGasStats("Public purchase request (with referral) transaction: ", publicBuyRequest);
            const balanceUpdatePub = findTransactionRequired(firstPublicPurchaseResult.transactions, {
                from: sampleTokenLaunch.address,
                on: firstPublicBuyerVault.address,
                op: UserVaultOps.balanceUpdate,
                success: true
            });
            printTxGasStats("Balance update (public purchase) transaction: ", balanceUpdatePub);
            const publicBuyFee = publicBuyRequestComputeFees + balanceUpdateCost;
            console.log(`Precomputed public buy total fee is equal to ${publicBuyFee} (${fromNano(publicBuyFee)} TON)`);
            expect(firstPublicPurchaseResult.transactions).toHaveTransaction({
                op: 0x0,
                to: referral.address,
                success: true,
                body: beginCell().storeUint(0, 32).storeStringTail("r").endCell(),
            });

            // Balance changes validation
            const saleMoneyFlowBeforeSecondPurchase = await sampleTokenLaunch.getMoneyFlows();
            const contractBalanceBeforeSecondPurchase = launchContractInstance.balance;
            const innerDataBeforeSecondPurchase = await sampleTokenLaunch.getInnerData();
            await sampleTokenLaunch.sendPublicPurchase({
                queryId: 2n,
                value: totalPurchaseValue,
                via: secondPublicBuyer.getSender()
            });
            const saleMoneyFlowAfter = await sampleTokenLaunch.getMoneyFlows();
            const contractBalanceAfter = launchContractInstance.balance;
            const innerDataAfter = await sampleTokenLaunch.getInnerData();

            const totalTonsIncrease = saleMoneyFlowAfter.totalTonsCollected - saleMoneyFlowBeforeSecondPurchase.totalTonsCollected;
            // Represents all the new value, accounted and managed by smart-contract
            const totalDifferenceAccounted = totalTonsIncrease + (innerDataAfter.operationalNeeds - innerDataBeforeSecondPurchase.operationalNeeds);
            const totalActualDifference = contractBalanceAfter - contractBalanceBeforeSecondPurchase;
            const divergence = totalDifferenceAccounted - totalActualDifference;
            if (divergence > 0) {
                console.warn(`\"dead\" tons (public buy): ${fromNano(divergence)} (${divergence})`);
                console.warn(` - total actual difference (public buy): ${fromNano(totalActualDifference)} (${totalActualDifference})`);
                console.warn(` - expected difference: ${fromNano(totalDifferenceAccounted)} (${totalDifferenceAccounted})`);
            }
            const [firstPublicBuyerVaultData, secondPublicBuyerVaultData] = await Promise.all(
                [firstPublicBuyerVault, secondPublicBuyerVault].map((buyer) => buyer.getVaultData())
            );
            const { purified } = validateValueMock(totalPurchaseValue, publicBuyFee, PURCHASE_FEE_PERCENT);
            const amountOut = getPublicAmountOut({
                    syntheticTonReserve: saleMoneyFlowAfterFirstPublicBuy.syntheticTonReserve,
                    syntheticJetReserve: saleMoneyFlowAfterFirstPublicBuy.syntheticJetReserve
                }, GlobalVersions.V1, purified
            );
            console.log(`jettons in vault: ${jettonFromNano(secondPublicBuyerVaultData.jettonBalance!)}, expected: ${jettonFromNano(amountOut)}`);
            expect(secondPublicBuyerVaultData.jettonBalance!).toBeGreaterThanOrEqual(amountOut);
            console.log(`1st public buy out: ${jettonFromNano(firstPublicBuyerVaultData.jettonBalance!)}, second one ${jettonFromNano(secondPublicBuyerVaultData.jettonBalance!)}`);
        }, 20000);
        test("stranger can't steal money via refund", async () => {
            const refundStranger = await blockchain.treasury("refund_stranger");
            const strangerRefundResult = await sampleTokenLaunch.sendRefundConfirmation({
                queryId: 0n, via: refundStranger.getSender(), value: toNano("0.1")
            }, BalanceUpdateMode.TotalWithdrawal);

            expect(strangerRefundResult.transactions).toHaveTransaction({
                from: refundStranger.address,
                to: sampleTokenLaunch.address,
                op: TokensLaunchOps.RefundConfirmation,
                success: false,
                exitCode: 73
            });
        });
        test("refund cases (balance consistency test)", async () => {
            // Two refund scenarios affecting token flows within the contract:
            // 1. Whitelist refund during the public round (freed value should be added to public round circulation).
            // 2. Public refund.
            const randomWlBuyer = await blockchain.treasury(`wl_buyer_2`);
            const moneyFlowsBeforeWl = await sampleTokenLaunch.getMoneyFlows();
            const configBefore = await sampleTokenLaunch.getConfig();
            const innerDataBeforeWl = await sampleTokenLaunch.getInnerData();

            const wlRefundResult = await sampleTokenLaunch.sendRefundRequest({
                    queryId: 0n,
                    value: toNano("0.03"),
                    via: randomWlBuyer.getSender()
                },
                BalanceUpdateMode.WhitelistWithdrawal
            );
            expect(wlRefundResult.transactions).toHaveTransaction({
                to: sampleTokenLaunch.address,
                op: TokensLaunchOps.RefundConfirmation,
                success: true,
            });
            const moneyFlowsAfterWl = await sampleTokenLaunch.getMoneyFlows();
            const configAfter = await sampleTokenLaunch.getConfig();
            const innerDataAfterWl = await sampleTokenLaunch.getInnerData();

            assert(innerDataBeforeWl.futJetInnerBalance < innerDataAfterWl.futJetInnerBalance,
                `${innerDataBeforeWl.futJetInnerBalance} vs ${innerDataAfterWl.futJetInnerBalance}`);
            assert(configBefore.pubRoundFutJetLimit < configAfter.pubRoundFutJetLimit,
                `${configBefore.pubRoundFutJetLimit} vs ${configAfter.pubRoundFutJetLimit}`);
            assert(moneyFlowsBeforeWl.syntheticJetReserve < moneyFlowsAfterWl.syntheticJetReserve,
                `${moneyFlowsBeforeWl.syntheticJetReserve} vs ${moneyFlowsAfterWl.syntheticJetReserve}`);

            const moneyFlowsBeforePublic = await sampleTokenLaunch.getMoneyFlows();
            const innerDataBeforePublic = await sampleTokenLaunch.getInnerData();
            const randomPublicBuyer = await blockchain.treasury(`pub_buyer_1`);
            const pubRefundResult = await sampleTokenLaunch.sendRefundRequest({
                    queryId: 0n,
                    value: toNano("0.03"),
                    via: randomPublicBuyer.getSender()
                },
                BalanceUpdateMode.PublicWithdrawal
            );
            expect(pubRefundResult.transactions).toHaveTransaction({
                to: sampleTokenLaunch.address,
                op: TokensLaunchOps.RefundConfirmation,
                success: true,
            });
            const moneyFlowsAfterPublic = await sampleTokenLaunch.getMoneyFlows();
            const innerDataAfterPublic = await sampleTokenLaunch.getInnerData();

            assert(innerDataBeforePublic.futJetInnerBalance < innerDataAfterPublic.futJetInnerBalance,
                `${innerDataBeforePublic.futJetInnerBalance} vs ${innerDataAfterPublic.futJetInnerBalance}`);
            assert(moneyFlowsBeforePublic.publicRoundFutJetSold > moneyFlowsAfterPublic.publicRoundFutJetSold,
                `${moneyFlowsBeforePublic.publicRoundFutJetSold} vs ${moneyFlowsAfterPublic.publicRoundFutJetSold}`);
        });
        test("refunds work good (at this moment you may get tired from this typical names)", async () => {
            // At this point we have a guy called consumer, that have some wl goods and public goods in his vault
            // We'll test public and wl refunds one by one, reset state and test global refund ^^
            const stateBeforeRefunds = blockchain.snapshot();
            const tokenLaunchContractInstance = await blockchain.getContract(sampleTokenLaunch.address);
            const contractBalanceBefore = tokenLaunchContractInstance.balance;
            console.log(`Token launch balance before refunds: ${tokenLaunchContractInstance.balance} (${fromNano(tokenLaunchContractInstance.balance)} TON)`);
            const [saleMoneyFlowBeforeRefunds, tokenLaunchInnerDataBeforeRefunds, consumerVaultStateBeforeRefunds] = await Promise.all([
                sampleTokenLaunch.getMoneyFlows(), await sampleTokenLaunch.getInnerData(), await consumerVault.getVaultData()
            ]);

            /* WHITELIST REFUND */
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
                op: TokensLaunchOps.RefundRequest,
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
                op: TokensLaunchOps.RefundConfirmation,
                success: true,
            });
            const refundConfirmationComputeFee = printTxGasStats("Whitelist refund confirmation transaction: ", wlRefundConfirmationTx);
            const [consumerVaultStateAfterWlRef, saleMoneyFlowAfterWlRef, tokenLaunchInnerDataAfterWlRef] = await Promise.all([
                consumerVault.getVaultData(), sampleTokenLaunch.getMoneyFlows(), sampleTokenLaunch.getInnerData()
            ]);
            const { purified, opn } = validateValueMock(valueToWithdraw, 0n, REFUND_FEE_PERCENT);

            const refundGasConsumption = refundCost(
                refundRequestComputeFee,
                balanceUpdateCost,
                computeFwdFees(msgPrices, 1n, 739n),
                refundConfirmationComputeFee,
            );
            console.log(`Total refund transaction cost: ${refundGasConsumption} (${fromNano(refundGasConsumption)} TON)`);

            const contractBalanceAfter = tokenLaunchContractInstance.balance;
            // These tests are able to guarantee, that refund system operating the correct way (pay attention to its mechanics, and you'll understand why ;))
            expect(consumerVaultStateAfterWlRef.wlTonBalance).toEqual(0n);
            expect(saleMoneyFlowBeforeRefunds.totalTonsCollected).toEqual(saleMoneyFlowAfterWlRef.totalTonsCollected + valueToWithdraw);
            expect(contractBalanceAfter).toBeGreaterThanOrEqual(contractBalanceBefore - purified);
            expect(tokenLaunchInnerDataAfterWlRef.operationalNeeds).toEqual(tokenLaunchInnerDataBeforeRefunds.operationalNeeds + opn);

            /* PUBLIC REFUND */
            const {
                syntheticTonReserve: syntheticTonReserveBefore,
                syntheticJetReserve: syntheticJetReserveBefore
            } = await sampleTokenLaunch.getMoneyFlows();
            const pubRefundResult = await sampleTokenLaunch.sendRefundRequest({
                    queryId: 4n,
                    value: toNano("0.03"),
                    via: consumer.getSender()
                },
                BalanceUpdateMode.PublicWithdrawal
            );
            expect(pubRefundResult.transactions).toHaveTransaction({
                from: consumerVault.address,
                to: sampleTokenLaunch.address,
                op: TokensLaunchOps.RefundConfirmation,
                success: true,
            });
            const pubRefundRequestTx = findTransactionRequired(pubRefundResult.transactions, {
                from: consumer.address,
                to: sampleTokenLaunch.address,
                op: TokensLaunchOps.RefundRequest,
                success: true,
            });
            printTxGasStats("Public refund request transaction: ", pubRefundRequestTx);

            const drainedVaultData = await consumerVault.getVaultData();
            assert(
                !(
                    drainedVaultData.wlTonBalance
                    || drainedVaultData.publicTonBalance
                    || drainedVaultData.jettonBalance
                ),
                "must be drained"
            );
            const {
                syntheticTonReserve: syntheticTonReserveAfter,
                syntheticJetReserve: syntheticJetReserveAfter
            } = await sampleTokenLaunch.getMoneyFlows();
            assert(
                (syntheticTonReserveAfter < syntheticTonReserveBefore) && (syntheticJetReserveAfter > syntheticJetReserveBefore),
                `TONs: before: ${fromNano(syntheticTonReserveBefore)}, after: ${fromNano(syntheticTonReserveAfter)}\n\
                 Jettons: before: ${jettonFromNano(syntheticJetReserveBefore)}, after: ${jettonFromNano(syntheticJetReserveAfter)}`
            );
            console.log(`TONs: before: ${fromNano(syntheticTonReserveBefore)}, after: ${fromNano(syntheticTonReserveAfter)}\n\
                 Jettons: before: ${jettonFromNano(syntheticJetReserveBefore)}, after: ${jettonFromNano(syntheticJetReserveAfter)}`);
            await blockchain.loadFrom(stateBeforeRefunds);
            const restoredVaultData = await consumerVault.getVaultData();
            assert(
                restoredVaultData.wlTonBalance
                && restoredVaultData.publicTonBalance
                && restoredVaultData.jettonBalance,
                "must be full"
            );

            /* TOTAL REFUND */
            const totalRefundResult = await sampleTokenLaunch.sendRefundRequest({
                    queryId: 4n,
                    value: toNano("0.03"),
                    via: consumer.getSender()
                },
                BalanceUpdateMode.TotalWithdrawal
            );
            expect(totalRefundResult.transactions).toHaveTransaction({
                op: TokensLaunchOps.RefundConfirmation,
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
        }, 20000);
        test("deployment works properly", async () => {
            const [saleTimings, saleMoneyFlowBefore, innerDataBefore, chiefBalanceBefore] = await Promise.all([
                sampleTokenLaunch.getSaleTimings(), sampleTokenLaunch.getMoneyFlows(), sampleTokenLaunch.getInnerData(), chief.getBalance()
            ]);
            blockchain.now = saleTimings.publicRoundEndTime + 1;

            // Amount of tons required
            const _needed = saleMoneyFlowBefore.totalTonsCollected + innerDataBefore.operationalNeeds + 118526443n
                + computeStorageFee(storagePrices, tokenLaunchStorageStats, BigInt(ONE_MONTH));
            const jettonDeploymentRes = await sampleTokenLaunch.sendDeployJetton({
                via: chief.getSender(),
                queryId: 1n,
                value: toNano("1")
            });
            const jettonDeploymentRequestTx = findTransactionRequired(jettonDeploymentRes.transactions, {
                op: TokensLaunchOps.DeployJetton,
                success: true
            });
            const jettonDeploymentRequestComputeFee = printTxGasStats("Jetton deployment request transaction ", jettonDeploymentRequestTx);
            const jettonMintRequestTx = findTransactionRequired(jettonDeploymentRes.transactions, {
                op: JettonOps.Mint,
                success: true
            });
            const jettonMintRequestComputeFee = printTxGasStats("Jetton mint request transaction ", jettonMintRequestTx);
            const mintedAmountTransferAcceptanceTx = findTransactionRequired(jettonDeploymentRes.transactions, {
                op: JettonOps.InternalTransfer,
                success: true,
            });
            printTxGasStats("Jetton transfer acceptance request transaction ", mintedAmountTransferAcceptanceTx);
            const enrollmentAcceptanceTx = findTransactionRequired(jettonDeploymentRes.transactions, {
                op: JettonOps.TransferNotification,
                on: sampleTokenLaunch.address,
                success: true,
            });
            const enrollmentAcceptanceComputeFee = printTxGasStats("Jetton enrollment confirmation transaction ", enrollmentAcceptanceTx);
            const revokeAdminRequestTx = findTransactionRequired(jettonDeploymentRes.transactions, {
                op: JettonOps.RevokeAdmin,
                from: sampleTokenLaunch.address,
                on: derivedJettonMaster.address,
                success: true,
            });
            const revokeAdminRequestComputeFee = printTxGasStats("Revoke admin request transaction ", revokeAdminRequestTx);

            const [launchFutJetWallet, chiefFutJetWallet] = [sampleTokenLaunch, chief].map((a) => {
                return JettonWallet.createFromConfig({
                    jettonMasterAddress: derivedJettonMaster.address,
                    ownerAddress: a.address
                }, jettonWalletCode);
            });
            const chiefJettonsTransferRequestComputeFee = findTransactionRequired(jettonDeploymentRes.transactions, {
                op: JettonOps.Transfer,
                from: sampleTokenLaunch.address,
                on: launchFutJetWallet.address,
                success: true,
            });
            printTxGasStats("Chief jettons transfer request transaction ", chiefJettonsTransferRequestComputeFee);
            const chiefJettonsTransferAcceptanceComputeFee = findTransactionRequired(jettonDeploymentRes.transactions, {
                op: JettonOps.InternalTransfer,
                from: launchFutJetWallet.address,
                on: chiefFutJetWallet.address,
                success: true,
            });
            printTxGasStats("Chief jettons transfer acceptance transaction ", chiefJettonsTransferAcceptanceComputeFee);
            const goodsForwardingTx = findTransactionRequired(jettonDeploymentRes.transactions, {
                op: JettonOps.TransferNotification,
                from: chiefFutJetWallet.address,
                on: chief.address,
                success: true,
                value: (v) => (v ?? 0) >= saleMoneyFlowBefore.totalTonsCollected
            });
            const final = printTxGasStats("Goods forwarding to chief transaction ", goodsForwardingTx);
            expect(jettonDeploymentRes.transactions).toHaveTransaction({
                op: JettonOps.Excesses,
                from: sampleTokenLaunch.address,
                to: chief.address,
                value: (v) => (v ?? 0) >= toNano("0.8")
            });
            // get_jetton_deployment_total_gas_cost mock
            const totalFees = jettonDeploymentRequestComputeFee
                + computeFwdFees(msgPrices, 3n, 1366n)
                + forwardStateInitOverhead(msgPrices, jettonMasterStorageStats)
                + jettonMintRequestComputeFee
                + computeStorageFee(storagePrices, jettonMasterStorageStats, 24n * 3600n * 7n)
                + enrollmentAcceptanceComputeFee
                + JETTON_MIN_TRANSFER_FEE * 3n
                + computeFwdFees(msgPrices, 1n, 96n)
                + revokeAdminRequestComputeFee
                + computeFwdFees(msgPrices, 1n, 248n)
                + final;
            console.log(`Total ~ deployment cost is ${totalFees} (${fromNano(totalFees)})`);
            const chiefBalanceAfter = await chief.getBalance();
            if ((chiefBalanceAfter - chiefBalanceBefore) < saleMoneyFlowBefore.totalTonsCollected) {
                console.log(`chief balance before: ${formatValue(chiefBalanceBefore)} | after ${formatValue(chiefBalanceBefore)} |` +
                    ` diff: ${formatValue(chiefBalanceBefore - chiefBalanceBefore)} | c: ${formatValue(saleMoneyFlowBefore.totalTonsCollected)}`);
                throw new Error("chief got less tokens than should");
            }
        }, 20000);
        test("jetton master on-chain state stats", async () => {
            const smc = await blockchain.getContract(derivedJettonMaster.address);
            assert(smc.accountState, "Can't access jetton master's state");
            // Runtime doesn't see assert here lol
            if (smc.accountState.type !== "active") throw new Error("Jetton master is not active");
            assert(smc.account.account, "Can't access token launch!");
            console.log(
                "Jetton master storage stats:",
                smc.account.account.storageStats.used
            );
            const stateCell = beginCell().store(storeStateInit(smc.accountState.state)).endCell();
            console.log("Jetton master state stats:", collectCellStats(stateCell, []));
        });
        test("deployment results are correct", async () => {
            const derivedJettonChiefWallet = blockchain.openContract(JettonWallet.createFromConfig({
                jettonMasterAddress: derivedJettonMaster.address,
                ownerAddress: chief.address
            }, jettonWalletCode));
            const derivedJettonLaunchWallet = blockchain.openContract(JettonWallet.createFromConfig({
                jettonMasterAddress: derivedJettonMaster.address,
                ownerAddress: sampleTokenLaunch.address
            }, jettonWalletCode));
            const [currentConfig, launchData, innerData, chiefDerivedJettonBalance, launchDerivedJettonBalance] = await Promise.all([
                sampleTokenLaunch.getConfig(),
                sampleTokenLaunch.getLaunchData(),
                sampleTokenLaunch.getInnerData(),
                derivedJettonChiefWallet.getJettonBalance(),
                derivedJettonLaunchWallet.getJettonBalance()
            ]);
            assert(chiefDerivedJettonBalance === currentConfig.futJetDexAmount + currentConfig.futJetPlatformAmount);
            assert(launchDerivedJettonBalance === launchData.futJetTotalSupply - chiefDerivedJettonBalance);
            assert(launchDerivedJettonBalance === innerData.futJetDeployedBalance);
        }, 20000);
        test("opn needs being claimed properly", async () => {
            const { operationalNeeds: opnBefore } = await sampleTokenLaunch.getInnerData();
            console.log(`Collected ${fromNano(opnBefore)} TONs as operational needs`);
            const claimOpnResult = await sampleTokenLaunch.sendClaimOpn({
                queryId: 0n,
                value: toNano("1"),
                via: chief.getSender()
            });
            const { operationalNeeds: opnAfter } = await sampleTokenLaunch.getInnerData();
            assert(!opnAfter);

            const claimOpnTx = findTransactionRequired(claimOpnResult.transactions, {
                op: TokensLaunchOps.ClaimOpn,
                success: true
            });
            printTxGasStats("Claim opn transaction: ", claimOpnTx);
            expect(claimOpnResult.transactions).toHaveTransaction({
                op: TokensLaunchOps.ClaimOpn,
                success: true
            });
            expect(claimOpnResult.transactions).toHaveTransaction({
                op: 0x0,
                success: true,
                value: x => x! > opnBefore * 9n / 10n
            });
        });
        test("claim works correctly", async () => {
            const { wlTonBalance, jettonBalance } = await consumerVault.getVaultData();
            const moneyFlows = await sampleTokenLaunch.getMoneyFlows();
            const config = await sampleTokenLaunch.getConfig();
            const queryId = 1n;
            const { futJetInnerBalance } = await sampleTokenLaunch.getInnerData();

            const expectedJettonAmount = getApproximateClaimAmount(
                moneyFlows, config, { futJetInnerBalance, futJetTotalSupply: sampleLaunchParams.totalSupply },
                { whitelistTons: wlTonBalance ?? 0n, publicJettons: jettonBalance ?? 0n, isCreator: false }
            );
            const expectedByContractJettonAmount = await sampleTokenLaunch.getApproximateClaimAmount(
                wlTonBalance ?? 0n, jettonBalance ?? 0n, false
            );

            console.log(`499 check: ${jettonFromNano(futJetInnerBalance - config.futJetDexAmount - config.futJetPlatformAmount)} == ${jettonFromNano(config.pubRoundFutJetLimit - moneyFlows.publicRoundFutJetSold)}`);
            console.log(`expected off-chain & by-contract: ${jettonFromNano(expectedJettonAmount)} & ${jettonFromNano(expectedByContractJettonAmount)}`);

            const claimRequestResult = await sampleTokenLaunch.sendJettonClaimRequest({
                queryId,
                value: toNano("0.1"),
                via: consumer.getSender()
            });
            const claimRequestTx = findTransactionRequired(claimRequestResult.transactions, {
                op: TokensLaunchOps.JettonClaimRequest,
                to: sampleTokenLaunch.address,
                success: true
            });
            const claimRequestComputeFee = printTxGasStats("Claim request transaction: ", claimRequestTx);
            const claimConfirmationRequestTx = findTransactionRequired(claimRequestResult.transactions, {
                op: UserVaultOps.Claim,
                to: consumerVault.address,
                success: true
            });
            const claimConfirmationRequestComputeFee = printTxGasStats("Claim confirmation request transaction: ", claimConfirmationRequestTx);
            const claimConfirmationTx = findTransactionRequired(claimRequestResult.transactions, {
                op: TokensLaunchOps.JettonClaimConfirmation,
                to: sampleTokenLaunch.address,
                success: true
            });
            const claimConfirmationComputeFee = printTxGasStats("Claim confirmation transaction: ", claimConfirmationTx);
            expect(claimRequestResult.transactions).toHaveTransaction({
                op: JettonOps.Transfer,
                to: tokenLaunchDerivedJettonWallet.address,
                success: true,
                body: beginCell()
                    .storeUint(JettonOps.Transfer, 32)
                    .storeUint(queryId, 64)
                    .storeCoins(expectedByContractJettonAmount)
                    .storeAddress(consumer.address)
                    .storeAddress(consumer.address)
                    .storeMaybeRef()
                    .storeCoins(computeGasFee(gasPrices, 350n))
                    .storeMaybeRef(beginCell().storeStringTail("claim").endCell())
                    .endCell()
            });
            const transferNotificationTx = findTransactionRequired(claimRequestResult.transactions, {
                op: JettonOps.TransferNotification,
                to: consumer.address,
                success: true,
                body: beginCell()
                    .storeUint(JettonOps.TransferNotification, 32)
                    .storeUint(queryId, 64)
                    .storeCoins(expectedByContractJettonAmount)
                    .storeAddress(sampleTokenLaunch.address)
                    .storeBit(true)
                    .storeStringRefTail("claim")
                    .endCell()
            });
            printTxGasStats("Transfer notification transaction: ", transferNotificationTx);
            const totalFees = claimRequestComputeFee
                + computeFwdFees(msgPrices, 1n, 96n)
                + claimConfirmationRequestComputeFee
                + computeStorageFee(storagePrices, userVaultStorageStats, BigInt(TWO_MONTHS))
                + computeFwdFees(msgPrices, 1n, 739n)
                + claimConfirmationComputeFee
                + JETTON_MIN_TRANSFER_FEE;
            console.log(`Total ~ claim cost is ${totalFees} (${fromNano(totalFees)})`);

            const consumerJettonWallet = blockchain.openContract(
                JettonWallet.createFromConfig({
                    jettonMasterAddress: derivedJettonMaster.address, ownerAddress: consumer.address
                }, jettonWalletCode)
            );
            const consumerClaimedAmount = await consumerJettonWallet.getJettonBalance();
            assert(
                (expectedJettonAmount === consumerClaimedAmount)
                && (expectedJettonAmount === expectedByContractJettonAmount),
                `${jettonFromNano(expectedJettonAmount)} | ${jettonFromNano(consumerClaimedAmount)} | ${jettonFromNano(expectedByContractJettonAmount)}`
            );
            console.log(`Claimed by consumer: ${jettonFromNano(consumerClaimedAmount)}`);

        }, 20000);
        // This test should only run when most other tests are disabled,
        // and it's certain that only three users participated, sharing the entire user allocation.
        test.skip("the internal share calculation operates correctly", async () => {
            const config = await sampleTokenLaunch.getConfig();
            const consumerJettonWallet = blockchain.openContract(
                JettonWallet.createFromConfig({
                    jettonMasterAddress: derivedJettonMaster.address, ownerAddress: consumer.address
                }, jettonWalletCode)
            );
            const consumerClaimedAmount = await consumerJettonWallet.getJettonBalance();

            const creatorClaimRequestResult = await sampleTokenLaunch.sendJettonClaimRequest({
                queryId: 0n,
                value: toNano("0.1"),
                via: creator.getSender()
            });
            expect(creatorClaimRequestResult.transactions).toHaveTransaction({
                op: TokensLaunchOps.JettonClaimConfirmation,
                to: sampleTokenLaunch.address,
                success: true
            });
            const creatorJettonWallet = blockchain.openContract(
                JettonWallet.createFromConfig({
                    jettonMasterAddress: derivedJettonMaster.address, ownerAddress: creator.address
                }, jettonWalletCode)
            );
            const creatorClaimedAmount = await creatorJettonWallet.getJettonBalance();
            console.log(`Claimed by creator: ${jettonFromNano(creatorClaimedAmount)}`);

            const secondPublicBuyer = await blockchain.treasury("public_buyer_2");
            const publicBuyer2ClaimRequestResult = await sampleTokenLaunch.sendJettonClaimRequest({
                queryId: 0n,
                value: toNano("0.1"),
                via: secondPublicBuyer.getSender()
            });

            expect(publicBuyer2ClaimRequestResult.transactions).toHaveTransaction({
                op: TokensLaunchOps.JettonClaimConfirmation,
                to: sampleTokenLaunch.address,
                success: true
            });
            const secondPublicBuyerJettonWallet = blockchain.openContract(
                JettonWallet.createFromConfig({
                    jettonMasterAddress: derivedJettonMaster.address, ownerAddress: secondPublicBuyer.address
                }, jettonWalletCode)
            );
            const secondPublicBuyerClaimedAmount = await secondPublicBuyerJettonWallet.getJettonBalance();
            console.log(`Claimed by second public buyer: ${jettonFromNano(secondPublicBuyerClaimedAmount)}`);

            console.log(`Total jettons claimed: ${jettonFromNano(consumerClaimedAmount + creatorClaimedAmount + secondPublicBuyerClaimedAmount)},\
\             free to sell supply: ${jettonFromNano(sampleLaunchParams.totalSupply - config.futJetDexAmount - config.futJetPlatformAmount)}`);
        });
    });
});
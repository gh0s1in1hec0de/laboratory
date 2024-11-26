import {
    MsgPrices, printTxsLogs, StorageStats, getStoragePrices, StorageValue, formatValue,
    collectCellStats, computedGeneric, computeFwdFees, getGasPrices, computeGasFee,
    FullFees, GasPrices, computeFwdFeesVerbose, getMsgPrices, computeStorageFee,
} from "./utils";
import {
    BASECHAIN, getPublicAmountOut, getApproximateClaimAmount, packLaunchConfigV1ToCell,
    PERCENTAGE_DENOMINATOR, getCreatorAmountOut, UserVaultOps, CoreOps, GlobalVersions,
    MAX_WL_ROUND_TON_LIMIT, BalanceUpdateMode, LaunchConfigV1, getQueryId, toPct,
    JETTON_MIN_TRANSFER_FEE, TokensLaunchOps, jettonFromNano, validateValueMock,
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
        coreStorageStats = new StorageStats(50000n, 150n);
        userVaultStorageStats = new StorageStats(5092n, 17n);
        tokenLaunchStorageStats = new StorageStats(50000n, 150n);
        jettonMasterStorageStats = new StorageStats(16703n, 35n);

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
            computeStorageFee(storagePrices, userVaultStorageStats, BigInt(TWO_MONTHS))
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
            const newConfig = launchConfig;
            newConfig.minTonForSaleSuccess = toNano("666");
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
            const minTonForSaleSuccessBefore = launchConfig.minTonForSaleSuccess;

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
            launchConfig.minTonForSaleSuccess = minTonForSaleSuccessBefore;

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
            const gasPrices = getGasPrices(blockchain.config, BASECHAIN);
            const expectedFee = computeGasFee(gasPrices, 13938n); // Computed by printTxGasStats later

            const buyoutTransactionResult = await sampleTokenLaunch.sendCreatorBuyout({
                via: creator.getSender(), value, queryId: 0n
            });

            const buyoutTx = findTransactionRequired(buyoutTransactionResult.transactions, {
                from: creator.address,
                on: sampleTokenLaunch.address,
                op: TokensLaunchOps.CreatorBuyout,
                success: true,
            });
            printTxGasStats("Creator buyout transaction:", buyoutTx);

            const tokenLaunchConfigAfter = await sampleTokenLaunch.getConfig();
            const tokenLaunchState = await sampleTokenLaunch.getMoneyFlows();
            const contractBalanceAfter = launchContractInstance.balance;

            // frustrating situation has arisen at the point of small difference between expected and actual balances difference
            // The only solution I really see here is to artificially low deposit figures
            const precomputedBalanceDifference = value - expectedFee;
            const actualBalanceDifference = contractBalanceAfter - contractBalanceBefore;
            const balanceDiff = precomputedBalanceDifference - actualBalanceDifference;
            if (balanceDiff) {
                console.warn(`actual contract balance increased less than expected on ${fromNano(balanceDiff)} (${balanceDiff}): `);
                console.warn(`actual difference: ${fromNano(actualBalanceDifference)} (${actualBalanceDifference}) | expected difference: ${fromNano(precomputedBalanceDifference)} (${precomputedBalanceDifference})`);
            }

            const expectedCreatorBalance = getCreatorAmountOut(GlobalVersions.V2, value, {
                    wlRoundFutJetLimit: BigInt(launchConfig.jetWlLimitPct) * sampleLaunchParams.totalSupply / PERCENTAGE_DENOMINATOR,
                    wlRoundTonLimit: launchConfig.tonLimitForWlRound
                },
                expectedFee
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
            const { purified } = validateValueMock(creatorTonsCollected, 0n);
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
            const { purified } = validateValueMock(totalPurchaseValue, totalFee);
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
            assert(purified <= consumerVaultDataAfter.wlTonBalance!, `${purified} vs ${consumerVaultDataAfter.wlTonBalance}`);
            assert(totalTonsIncrease === consumerVaultDataAfter.wlTonBalance!, "inconsistent state");
        }, 20000);
        test("wl limit cutoff works the proper way", async () => {
            const oldTimings = await sampleTokenLaunch.getSaleTimings();
            const totalPurchaseValue = toNano("15");
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
        test("high public purchase pressure", async () => {
            blockchain.now = (await sampleTokenLaunch.getSaleTimings()).wlRoundEndTime + 1;
            const totalBuys = 30; // we can also set 100
            const publicBuyers = await Promise.all(
                Array.from({ length: totalBuys }, (_, i) =>
                    blockchain.treasury(`pub_buyer_${i + 1}`, { balance: toNano("1000000") }))
            );

            const { pubRoundFutJetLimit } = await sampleTokenLaunch.getConfig();
            const { publicRoundFutJetSold } = await sampleTokenLaunch.getMoneyFlows();
            assert(!publicRoundFutJetSold, "there was no pub purchases before");

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
                    .map((data, index) => `Public buyer #${index + 1} jettons after buy: ${jettonFromNano(data.jettonBalance!)}`)
                    .join("\n")
            );
        }, 20000);
        test("public buys work the proper way", async () => {
            const secondPublicBuyer = await blockchain.treasury("public_buyer_2");
            const launchContractInstance = await blockchain.getContract(sampleTokenLaunch.address);

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
            const totalPurchaseValue = toNano("50");
            const firstPublicPurchaseResult = await sampleTokenLaunch.sendPublicPurchase({
                queryId: 1n,
                value: totalPurchaseValue,
                via: consumer.getSender()
            });
            const [saleMoneyFlowAfterFirstPublicBuy, configAfter] = await Promise.all([sampleTokenLaunch.getMoneyFlows(), sampleTokenLaunch.getConfig()]);
            assert(
                (configBefore.creatorFutJetLeft + configBefore.pubRoundFutJetLimit) === configAfter.pubRoundFutJetLimit,
                "creator's leftovers must flow to public round"
            );
            assert(configAfter.creatorFutJetLeft === 0n);
            const publicBuyRequest = findTransactionRequired(firstPublicPurchaseResult.transactions, {
                from: consumer.address,
                on: sampleTokenLaunch.address,
                op: TokensLaunchOps.PublicPurchase,
                success: true
            });
            const publicBuyRequestComputeFees = printTxGasStats("Public purchase request transaction: ", publicBuyRequest);
            const balanceUpdatePub = findTransactionRequired(firstPublicPurchaseResult.transactions, {
                from: sampleTokenLaunch.address,
                on: firstPublicBuyerVault.address,
                op: UserVaultOps.balanceUpdate,
                success: true
            });
            printTxGasStats("Balance update (public purchase) transaction: ", balanceUpdatePub);
            const publicBuyFee = publicBuyRequestComputeFees + balanceUpdateCost;
            console.log(`Precomputed public buy total fee is equal to ${publicBuyFee} (${fromNano(publicBuyFee)} TON)`);

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
            const { purified } = validateValueMock(totalPurchaseValue, publicBuyFee);
            const amountOut = getPublicAmountOut({
                    syntheticTonReserve: saleMoneyFlowAfterFirstPublicBuy.syntheticTonReserve,
                    syntheticJetReserve: saleMoneyFlowAfterFirstPublicBuy.syntheticJetReserve
                }, GlobalVersions.V1, purified
            );
            console.log(`jettons in vault: ${jettonFromNano(secondPublicBuyerVaultData.jettonBalance!)}, expected: ${jettonFromNano(amountOut)}`);
            expect(secondPublicBuyerVaultData.jettonBalance!).toBeGreaterThanOrEqual(amountOut);
            expect(firstPublicBuyerVaultData.jettonBalance!).toBeGreaterThan(secondPublicBuyerVaultData.jettonBalance!);
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
            const { purified, opn } = validateValueMock(valueToWithdraw, 0n);

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
        test.skip("jetton master on-chain state stats", async () => {
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
        test("claim works as it should", async () => {
            const { wlTonBalance, jettonBalance } = await consumerVault.getVaultData();
            const moneyFlows = await sampleTokenLaunch.getMoneyFlows();
            const config = await sampleTokenLaunch.getConfig();
            const queryId = 1n;

            const expectedJettonAmount = getApproximateClaimAmount(
                moneyFlows, config, { whitelistTons: wlTonBalance ?? 0n, jettons: jettonBalance ?? 0n }
            );
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
                    .storeCoins(expectedJettonAmount)
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
                    .storeCoins(expectedJettonAmount)
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
            assert(expectedJettonAmount === await consumerJettonWallet.getJettonBalance());
        }, 20000);
    });
});
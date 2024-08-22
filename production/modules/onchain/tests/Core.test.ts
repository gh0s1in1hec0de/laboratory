import { Address, beginCell, Cell, fromNano, storeMessage, storeStateInit, toNano, Transaction } from "@ton/core";
import { CommonJettonMaster } from "../wrappers/CommonJettonMaster";
import {
    collectCellStats, computedGeneric, computeFwdFees, computeFwdFeesVerbose,
    FullFees, GasPrices, getGasPrices, getMsgPrices, getStoragePrices,
    MsgPrices, printTxsLogs, randomAddress, StorageStats, StorageValue,
} from "./utils";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { findTransactionRequired } from "@ton/test-utils";
import { TokenLaunch } from "../wrappers/TokenLaunch";
import { UserVault } from "../wrappers/UserVault";
import { LaunchConfig } from "starton-periphery";
import { compile } from "@ton/blueprint";
import { ok as assert } from "node:assert";
import { Core } from "../wrappers/Core";
import { JettonWallet, TonClient4 } from "@ton/ton";
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
import { CommonJettonWallet } from "../wrappers/CommonJettonWallet";

const PRINT_TX_LOGS = false;

describe("Core", () => {
    let coreCode = new Cell();
    let core: SandboxContract<Core>;

    let tokenLaunchCode = new Cell();
    let tokenLaunch: SandboxContract<TokenLaunch>;

    let userVaultCode = new Cell();
    let userVault: SandboxContract<UserVault>;

    let jettonMasterCode = new Cell();
    let jettonWalletCode = new Cell();
    // Seems like this approach is correct
    let utilityJettonMaster: SandboxContract<CommonJettonMaster>;
    let derivedJettonMaster: SandboxContract<CommonJettonMaster>;
    // Dedust related variables
    let factory: SandboxContract<Factory>;

    let blockchain: Blockchain;
    let chief: SandboxContract<TreasuryContract>;
    let msgPrices: MsgPrices;
    let gasPrices: GasPrices;
    let storagePrices: StorageValue;
    let launchConfig: LaunchConfig;

    // TODO Can't init atm
    let stateInitStats: StorageStats;
    let storageDuration: number;

    // Custom values
    let utilityJettonSupply: bigint;
    // Function initialization

    let printTxGasStats: (name: string, trans: Transaction) => bigint;
    // `force_ref` is set to `true` for bony-in-a-ref cases
    let estimateBodyFee: (body: Cell, force_ref: boolean, prices?: MsgPrices) => FullFees;
    let estimateBurnFwd: (prices?: MsgPrices) => bigint;
    let forwardOverhead: (prices: MsgPrices, stats: StorageStats) => bigint;
    let calcSendFees: (send_fee: bigint,
        recv_fee: bigint,
        fwd_fee: bigint,
        fwd_amount: bigint,
        storage_fee: bigint,
        state_init: bigint
    ) => bigint;

    let estimateTransferFwd: (amount: bigint, fwd_amount: bigint,
        fwd_payload: Cell | null,
        custom_payload: Cell | null,
        prices?: MsgPrices) => bigint;
    beforeAll(async () => {
        coreCode = await compile("Core");
        tokenLaunchCode = await compile("TokenLaunch");
        userVaultCode = await compile("UserVault");
        jettonMasterCode = await compile("CommonJettonMaster");
        jettonWalletCode = await compile("CommonJettonWallet");
        console.info("contracts compiled yaay^^");

        blockchain = await Blockchain.create({
            storage: new RemoteBlockchainStorage(wrapTonClient4ForRemote(new TonClient4({
                endpoint: await getHttpV4Endpoint({ network: "mainnet" }),
            })))
        });
        // https://github.com/ton-org/sandbox?tab=readme-ov-file#viewing-logs
        // We can also use approach, described in the link above, but seems like these logs are too intricate
        // and it is enough to use just `vmLogs` from txs
        blockchain.now = Math.floor(Date.now() / 1000);

        msgPrices = getMsgPrices(blockchain.config, 0);
        gasPrices = getGasPrices(blockchain.config, 0);
        storagePrices = getStoragePrices(blockchain.config);

        utilityJettonSupply = toNano("1000000"); // Replace with well-counted value

        // Me btw
        chief = await blockchain.treasury("chief");

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
        launchConfig = {
            minTonForSaleSuccess: 0n,
            tonLimitForWlRound: toNano("1000"), // Seems correct
            utilJetRewardAmount: utilityJettonSupply * 33n / 10000n,
            utilJetWlPassAmount: toNano("1"), // < & v - out of pants
            utilJetBurnPerWlPassAmount: toNano("0.3"),
            jetWlLimitPct: 3000,
            jetPubLimitPct: 3000,
            jetDexSharePct: 2500,
            creatorRoundDurationMs: ONE_HOUR_MS,
            wlRoundDurationMs: ONE_HOUR_MS,
            pubRoundDurationMs: ONE_HOUR_MS,
            claimDurationMs: ONE_HOUR_MS
        };
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
                        jettonLaunch: tokenLaunchCode,
                        jettonLaunchUserVault: userVaultCode,
                        derivedJettonMaster: jettonMasterCode,
                        jettonWallet: jettonWalletCode
                    }
                },
                coreCode
            )
        );
        // Measures fees for code execution (computational fee)
        printTxGasStats = (name, transaction) => {
            const txComputed = computedGeneric(transaction);
            console.log(`${name} used ${txComputed.gasUsed} gas`);
            console.log(`${name} gas cost: ${txComputed.gasFees}`);
            return txComputed.gasFees;
        };

        estimateBodyFee = (body, forceRef, prices) => {
            const curPrice = prices || msgPrices;
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

        estimateTransferFwd = (jetton_amount, fwd_amount,fwd_payload, custom_payload, prices) => {
            // Purpose is to account for the first biggest one fwd fee.
            // So, we use fwd_amount here only for body calculation

            const mockFrom = randomAddress(0);
            const mockTo   = randomAddress(0);

            const body     = CommonJettonWallet.transferMessage(jetton_amount, mockTo,
                mockFrom, custom_payload,
                fwd_amount, fwd_payload);

            const curPrices = prices || msgPrices;
            const feesRes   = estimateBodyFee(body, true, curPrices);
            const reverse   = feesRes.remaining * 65536n / (65536n - curPrices.firstFrac);
            expect(reverse).toBeGreaterThanOrEqual(feesRes.total);
            return reverse;
        }

        // TODO Jerks ?
        forwardOverhead = (prices, stats) => {
            // Meh, kinda lazy way of doing that, but tests are bloated enough already
            return computeFwdFees(prices, stats.cells, stats.bits) - prices.lumpPrice;
        };

        calcSendFees = (send, recv, fwd, fwd_amount, storage, state_init) => {
            const fwdTotal = fwd_amount + (fwd_amount > 0n ? fwd * 2n : fwd) + state_init;
            // const execute = send + recv;
            return fwdTotal + send + recv + storage + 1n;
        };
    }, 20000);

    it("should deploy", async () => {
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

        const deploymentTx = findTransactionRequired(deployResult.transactions, {
            from: chief.address,
            to: core.address,
            deploy: true,
            success: true
        });

        // const gasFees = printTxGasStats("Core deployment transaction:", deploymentTx);
        // console.log(fromNano(gasFees));

    });

    test("core state cost", async () => {
        const smc = await blockchain.getContract(core.address);
        assert(smc.accountState, "Can't access core account state");
        // Runtime doesn't see assert here lol
        if (smc.accountState.type !== "active")
            throw new Error("Wallet account is not active");
        assert(smc.account.account, "Can't access core account!");

        console.log(
            "Core ~ storage stats (dictionary is empty):",
            smc.account.account.storageStats.used
        );
        const stateCell = beginCell().store(storeStateInit(smc.accountState.state)).endCell();
        console.log("State init stats:", collectCellStats(stateCell, []));
    });
    test("fast check", async () => {
        // Just a buffer for a stuff you need to check fast
    });
});
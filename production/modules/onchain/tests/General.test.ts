import { Address, beginCell, Cell, storeMessage, toNano, Transaction } from "@ton/core";
import { CommonJettonMaster } from "../wrappers/CommonJettonMaster";
import {
    collectCellStats, computedGeneric, computeFwdFees, computeFwdFeesVerbose,
    FullFees, GasPrices, getGasPrices, getMsgPrices, getStoragePrices,
    MsgPrices, StorageStats, StorageValue,
} from "./utils";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { TokenLaunch } from "../wrappers/TokenLaunch";
import { UserVault } from "../wrappers/UserVault";
import { LaunchConfig } from "starton-periphery";
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
import { randomAddress } from "@ton/test-utils";


describe("TokenLaunch", () => {
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
        // Looks like this overloading doesn't give us any game-changing information
        // blockchain.verbosity = {
        //     print: true,
        //     blockchainLogs: true,
        //     vmLogs: "vm_logs_full",
        //     debugLogs: true,
        // };
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

        printTxGasStats = (name, transaction) => {
            const txComputed = computedGeneric(transaction);
            console.log(`${name} used ${txComputed.gasUsed} gas`);
            console.log(`${name} gas cost: ${txComputed.gasFees}`);
            return txComputed.gasFees;
        };

        estimateBodyFee = (body, forceRef, prices) => {
            // const curPrice = prices || msgPrices;
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

        // Jerks
        forwardOverhead = (prices, stats) => {
            // Meh, kinda lazy way of doing that, but tests are bloated enough already
            return computeFwdFees(prices, stats.cells, stats.bits) - prices.lumpPrice;
        };

        calcSendFees = (send, recv, fwd, fwd_amount, storage, state_init) => {
            const fwdTotal = fwd_amount + (fwd_amount > 0n ? fwd * 2n : fwd) + state_init;
            // const execute = send + recv;
            return fwdTotal + send + recv + storage + 1n;
        };
    });

    it("should deploy", async () => {
        const deployResult = await core.sendDeploy({ value: toNano("10"), via: chief.getSender() });

        for (const tx of deployResult.transactions) {
            console.log(tx.vmLogs)
            console.log(`=== NEW TX ===`);
        }

        expect(deployResult.transactions).toHaveTransaction({
            from: chief.address,
            to: core.address,
            deploy: true,
            success: true
        });
    });

    test("contract is active", async () => {
        console.log(await core.getLaunchConfig());
    });
    test("fast check", async () => {
        // Just a buffer for a stuff you need to check fast
    });
});
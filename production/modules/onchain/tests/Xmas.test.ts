import { findTransactionRequired, randomAddress } from "@ton/test-utils";
import { XmasJettonMaster } from "../wrappers/XmasJettonMaster";
import { XmasJettonWallet } from "../wrappers/XmasJettonWallet";
import { JettonOps, jettonToNano } from "starton-periphery";
import { printTxGasStats } from "./utils/gasUtils";
import { Address, Cell, toNano } from "@ton/core";
import { ok as assert } from "node:assert";
import { compile } from "@ton/blueprint";
import "@ton/test-utils";
import {
    TreasuryContract,
    SandboxContract,
    Blockchain,
} from "@ton/sandbox";

// Event boundaries – update before testing.
// Use `determine event timings` for convenience.
const START = 1732428013;
const END = 1732860013;

describe("Marry Christmas and happy New Year!", () => {
    let blockchain: Blockchain;
    let jettonMasterCode = new Cell();
    let jettonWalletCode = new Cell();

    let deployer: SandboxContract<TreasuryContract>;
    let deployerWallet: SandboxContract<XmasJettonWallet>;
    let jettonMaster: SandboxContract<XmasJettonMaster>;

    let userWallet: (owner: Address) => SandboxContract<XmasJettonWallet>;

    beforeAll(async () => {
        jettonMasterCode = await compile("XmasJettonMaster");
        jettonWalletCode = await compile("XmasJettonWallet");
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury("deployer", { balance: toNano("1000") });

        blockchain.now = Math.floor(Date.now() / 1000);

        jettonMaster = blockchain.openContract(
            XmasJettonMaster.createFromConfig(
                {
                    admin: deployer.address,
                    walletCode: jettonWalletCode,
                    jettonContent: { uri: "https://happy_xmas_bitch.com" },
                    supply: 0n
                },
                jettonMasterCode)
        );
        console.info(`Jetton master address: ${jettonMaster.address}`);

        userWallet = (ownerAddress) => blockchain.openContract(
            XmasJettonWallet.createFromConfig(
                { jettonMasterAddress: jettonMaster.address, ownerAddress },
                jettonWalletCode
            )
        );
        deployerWallet = userWallet(deployer.address);

    }, 20000);

    // Change constants to actual values before testing
    test.skip("determine event timings", () => console.info(blockchain.now! + 2 * 86400, blockchain.now! + 7 * 86400));

    describe("standard functions", () => {
        test("minting jettons", async () => {
            const mintResult = await jettonMaster.sendMint(
                deployer.getSender(), deployer.address, jettonToNano("1000000")
            );
            const mintTx = findTransactionRequired(mintResult.transactions, {
                op: JettonOps.InternalTransfer,
                on: deployerWallet.address,
                success: true,
                deploy: true
            });
            printTxGasStats("Mint transaction", mintTx);
        }, 20000);
        test("stranger can't increase supply", async () => {
            const increaseSupplyResult = await jettonMaster.sendIncreaseSupply(
                { queryId: 0n, via: deployer.getSender(), value: toNano("1") }
            );
            expect(increaseSupplyResult.transactions).toHaveTransaction({
                op: JettonOps.IncreaseSupply,
                on: jettonMaster.address,
                success: false,
                exitCode: 666
            });
        }, 20000);
        test("common transfer specs", async () => {
            const recipient = randomAddress();
            const transferAmount = jettonToNano("100");
            const transferResult = await deployerWallet.sendTransfer(
                deployer.getSender(), toNano("0.05"), transferAmount, recipient, deployer.address,
                null, toNano("0.0001"), null
            );

            const transferTx = findTransactionRequired(transferResult.transactions, {
                op: JettonOps.Transfer,
                success: true,
            });
            printTxGasStats("Transfer request transaction", transferTx);
            expect(transferResult.transactions).not.toHaveTransaction({
                op: JettonOps.IncreaseSupply,
                success: true
            });
            const internalTransferTx = findTransactionRequired(transferResult.transactions, {
                op: JettonOps.InternalTransfer,
                success: true,
            });
            printTxGasStats("Internal transfer transaction", internalTransferTx);

            // As the event hasn't been started yest
            const walletBalance = await userWallet(recipient).getJettonBalance();
            assert(walletBalance === transferAmount, `${walletBalance} vs ${transferAmount}`);
        }, 20000);
        test("burn specs", async () => {
            const burnResult = await jettonMaster.sendForceBurn(
                deployer.getSender(), jettonToNano("1"), deployer.address, null
            );
            const transferTx = findTransactionRequired(burnResult.transactions, {
                op: JettonOps.CallTo,
                success: true,
            });
            printTxGasStats("Burn request transaction", transferTx);
            const internalTransferTx = findTransactionRequired(burnResult.transactions, {
                op: JettonOps.Burn,
                success: true,
            });
            printTxGasStats("Burn confirmation transaction", internalTransferTx);
        }, 20000);
    });
    describe("event!", () => {
        test("christmas transfer", async () => {
            blockchain.now = START + 1;

            const supplyBefore = await jettonMaster.getTotalSupply();

            const recipient = randomAddress();
            const transferAmount = jettonToNano("100");
            const transferResult = await deployerWallet.sendTransfer(
                deployer.getSender(), toNano("0.07"), transferAmount, recipient, deployer.address,
                null, toNano("0.005"), null
            );

            const transferTx = findTransactionRequired(transferResult.transactions, {
                op: JettonOps.Transfer,
                success: true,
            });
            printTxGasStats("Transfer request transaction", transferTx);
            // const increaseSupplyTx = findTransactionRequired(transferResult.transactions, {
            //     op: JettonOps.IncreaseSupply,
            //     success: true,
            // });
            // printTxGasStats("Supply increase transaction", increaseSupplyTx);
            const internalTransferTx = findTransactionRequired(transferResult.transactions, {
                op: JettonOps.InternalTransfer,
                success: true,
            });
            printTxGasStats("Internal transfer transaction", internalTransferTx);

            // As the event hasn't been started yest
            const walletBalance = await userWallet(recipient).getJettonBalance();
            const supplyAfter = await jettonMaster.getTotalSupply();

            assert(walletBalance > transferAmount);
            assert(supplyAfter === (supplyBefore + walletBalance - transferAmount));
        }, 20000);

        test.skip("christmas transfers' statistics", async () => {
            const increaseCounts = { "2%": 0, "4%": 0, "7%": 0, "10%": 0, "15%": 0 };
            const totalTransfers = 100;

            for (let i = 0; i < totalTransfers; i++) {
                blockchain.now! += 1;
                const recipient = randomAddress();
                const transferAmount = jettonToNano("100");
                const transferResult = await deployerWallet.sendTransfer(
                    deployer.getSender(), toNano("1"), transferAmount, recipient, deployer.address,
                    null, toNano("0.1"), null
                );
                expect(transferResult.transactions).toHaveTransaction({
                    op: JettonOps.InternalTransfer,
                    success: true,
                });

                const walletBalance = await userWallet(recipient).getJettonBalance();
                const increaseAmount = walletBalance - transferAmount;
                const increasePercent = Math.round((Number(increaseAmount) / Number(transferAmount)) * 100);

                increaseCounts[`${increasePercent}%` as keyof typeof increaseCounts]++;
            }

            let result = "Increase type percentages:\n";
            for (const [type, count] of Object.entries(increaseCounts)) {
                const percentage = (count / totalTransfers) * 100;
                result += `${type} increase: ${percentage.toFixed(2)}%\n`;
            }
            console.log(result);
        }, 20000);
        test("event end", async () => {
            blockchain.now = END + 1;
            const recipient = randomAddress();
            const transferAmount = jettonToNano("100");
            const transferResult = await deployerWallet.sendTransfer(
                deployer.getSender(), toNano("1"), transferAmount, recipient, deployer.address,
                null, toNano("0.1"), null
            );
            expect(transferResult.transactions).not.toHaveTransaction({
                op: JettonOps.IncreaseSupply,
                success: true
            });
            expect(transferResult.transactions).toHaveTransaction({
                op: JettonOps.InternalTransfer,
                success: true,
            });

            // As the event has ended
            const walletBalance = await userWallet(recipient).getJettonBalance();
            assert(walletBalance === transferAmount);
        }, 20000);
    });
});
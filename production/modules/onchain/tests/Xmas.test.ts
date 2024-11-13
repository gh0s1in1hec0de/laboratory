import { findTransactionRequired, randomAddress } from "@ton/test-utils";
import { XmasJettonMaster } from "../wrappers/XmasJettonMaster";
import { XmasJettonWallet } from "../wrappers/XmasJettonWallet";
import { JettonOps, jettonToNano } from "starton-periphery";
import { Address, Cell, toNano } from "@ton/core";
import { compile } from "@ton/blueprint";
import "@ton/test-utils";
import {
    TreasuryContract,
    SandboxContract,
    Blockchain,
} from "@ton/sandbox";
import { printTxGasStats } from "./utils/gasUtils";

describe("Marry Christmas and happy New Year!", () => {
    let jettonMasterCode = new Cell();
    let jettonWalletCode = new Cell();
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let deployerWallet: SandboxContract<XmasJettonWallet>;
    let jettonMaster: SandboxContract<XmasJettonMaster>;

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
        deployerWallet = blockchain.openContract(
            XmasJettonWallet.createFromConfig(
                {
                    jettonMasterAddress: jettonMaster.address,
                    ownerAddress: deployer.address
                },
                jettonWalletCode
            )
        );

    }, 20000);
    test.skip("now", async () => console.info(blockchain.now! + 86400, blockchain.now! + 7 * 86400));
    test("minting jettons", async () => {
        const mintResult = await jettonMaster.sendMint(
            deployer.getSender(), deployer.address, jettonToNano("1000000")
        );
        expect(mintResult.transactions).toHaveTransaction({
            op: JettonOps.InternalTransfer,
            on: deployerWallet.address,
            success: true,
            deploy: true
        });
    }, 20000);
    test("common transfer specs", async () => {
        const transferResult = await deployerWallet.sendTransfer(
            deployer.getSender(), toNano("1"), jettonToNano("100"), randomAddress(), deployer.address,
            null, toNano("0.1"), null
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
    }, 20000);
});
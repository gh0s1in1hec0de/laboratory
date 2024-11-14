import { Blockchain, SandboxContract, TreasuryContract, } from "@ton/sandbox";
import { Cell, toNano, beginCell, Address, storeStateInit } from "@ton/core";
import { XmasJettonMaster } from "../wrappers/XmasJettonMaster";
import { XmasJettonWallet } from "../wrappers/XmasJettonWallet";
import { JettonOps } from "starton-periphery";
import { collectCellStats } from "./utils";
import { compile } from "@ton/blueprint";
import "@ton/test-utils";

let blockchain: Blockchain;
let deployer: SandboxContract<TreasuryContract>;
let jettonMaster: SandboxContract<XmasJettonMaster>;
let jettonMasterCode: Cell;
let jettonWalletCode: Cell;

let userWallet: (address: Address) => Promise<SandboxContract<XmasJettonWallet>>;

describe("State init tests", () => {
    beforeAll(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury("deployer");
        jettonWalletCode = await compile("XmasJettonWallet");
        jettonMasterCode = await compile("XmasJettonMaster");

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

        userWallet = async (address: Address) => blockchain.openContract(
            XmasJettonWallet.createFromAddress(
                await jettonMaster.getWalletAddress(address)
            )
        );

    });
    it("should deploy", async () => {
        const deployResult = await jettonMaster.sendDeploy(deployer.getSender(), toNano("10"));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMaster.address,
            deploy: true,
        });
        // Make sure it didn't bounce
        expect(deployResult.transactions).not.toHaveTransaction({
            on: deployer.address,
            from: jettonMaster.address,
            inMessageBounced: true
        });
    });
    it("should mint max jetton value", async () => {
        const maxValue = (2n ** 120n) - 1n;
        const deployerWallet = await userWallet(deployer.address);
        const res = await jettonMaster.sendMint(deployer.getSender(),
            deployer.address,
            maxValue,
            null, null, null);
        expect(res.transactions).toHaveTransaction({
            on: deployerWallet.address,
            op: JettonOps.InternalTransfer,
            success: true,
        });

        const curBalance = await deployerWallet.getJettonBalance();
        expect(curBalance).toEqual(maxValue);
    });
    it("jetton master specs", async () => {
        const smc = await blockchain.getContract(jettonMaster.address);
        if (smc.accountState === undefined)
            throw new Error("Can't access wallet account state");
        if (smc.accountState.type !== "active")
            throw new Error("Master account is not active");
        if (smc.account.account === undefined || smc.account.account === null)
            throw new Error("Can't access master account!");
        console.log("Jetton master max storage stats:", smc.account.account.storageStats.used);
        const state = smc.accountState.state;
        const stateCell = beginCell().store(storeStateInit(state)).endCell();
        console.log("State init stats:", collectCellStats(stateCell, []));
    });
    it("jetton wsallet specs", async () => {
        const smc = await blockchain.getContract((await userWallet(deployer.address)).address);
        if (smc.accountState === undefined)
            throw new Error("Can't access wallet account state");
        if (smc.accountState.type !== "active")
            throw new Error("Wallet account is not active");
        if (smc.account.account === undefined || smc.account.account === null)
            throw new Error("Can't access wallet account!");
        console.log("Jetton wallet max storage stats:", smc.account.account.storageStats.used);
        const state = smc.accountState.state;
        const stateCell = beginCell().store(storeStateInit(state)).endCell();
        console.log("State init stats:", collectCellStats(stateCell, []));
    });
});


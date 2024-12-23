import { Asset, Factory, JettonRoot, MAINNET_FACTORY_ADDR, PoolType, ReadinessStatus, VaultJetton } from "@dedust/sdk";
import { jettonContentToCell, JettonMinter, JettonMinterContent } from "../wrappers/JettonMinter";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { JettonWallet } from "../wrappers/JettonWallet";
import { Address, Cell, toNano } from "@ton/core";
import { Op } from "../wrappers/JettonConstants";
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
} from "@ton/sandbox";

// Due to very low chances of successful run, I have attached picture with test passings🥴
describe("General", () => {
    let jettonMasterCode = new Cell();
    let jettonWalletCode = new Cell();
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let justAGuy: SandboxContract<TreasuryContract>;
    let jettonMinter: SandboxContract<JettonMinter>;
    let userWallet: (address: Address) => Promise<SandboxContract<JettonWallet>>;
    let defaultContent: JettonMinterContent;

    // DeDust utilities
    let factory: SandboxContract<Factory>;

    beforeAll(async () => {
        jettonMasterCode = await compile("JettonMinter");
        jettonWalletCode = await compile("JettonWallet");
        blockchain = await Blockchain.create({
            // storage: new RemoteBlockchainStorage(wrapTonClient4ForRemote(
            //     new TonClient4({ // "https://mainnet-v4.tonhubapi.com"
            //         endpoint: await getHttpV4Endpoint({ network: "mainnet" }),
            //         timeout: 40000
            //     }))
            // )
        });
        deployer = await blockchain.treasury("deployer", { balance: toNano("1000") });
        justAGuy = await blockchain.treasury("just_a_guy", { balance: toNano("1000") });
        defaultContent = { uri: "https://some_stablecoin.org/meta.json" };

        blockchain.now = Math.floor(Date.now() / 1000);

        jettonMinter = blockchain.openContract(
            JettonMinter.createFromConfig(
                {
                    admin: deployer.address,
                    wallet_code: jettonWalletCode,
                    jetton_content: jettonContentToCell(defaultContent)
                },
                jettonMasterCode));
        userWallet = async (address: Address) => blockchain.openContract(
            JettonWallet.createFromAddress(
                await jettonMinter.getWalletAddress(address)
            )
        );

    }, 80000);
    test.skip("correct context", async () => {
        factory = blockchain.openContract(
            Factory.createFromAddress(MAINNET_FACTORY_ADDR)
        );
        const scaleAddress = Address.parse("EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE");
        const scaleVaultAddress = await factory.getVaultAddress(Asset.jetton(scaleAddress));
        console.log(`$SCALE vault address: ${Address.normalize(scaleVaultAddress)}`);
    }, 80000);
    test("minting jettons", async () => {
        const mintTxRes = await jettonMinter.sendMint(deployer.getSender(), deployer.address, toNano("1000"));
        expect(mintTxRes.transactions).toHaveTransaction({
            op: Op.internal_transfer,
            on: (await userWallet(deployer.address)).address,
            success: true,
            deploy: true
        });
    }, 80000);
    test("just a transfer", async () => {
        const transferResult = await (await userWallet(deployer.address)).sendTransfer(
            deployer.getSender(), toNano("0.5"), toNano("1.22"),
            justAGuy.address, deployer.address, null, toNano("0.4"), null
        );
        expect(transferResult.transactions).toHaveTransaction({
            op: Op.internal_transfer,
            on: (await userWallet(justAGuy.address)).address
        });
    });
    test("metadata reading trick", async () => {
        let { stack } = await (await userWallet(justAGuy.address)).getWalletDataSerialized();
        stack.skip(2);
        const jettonMinterAddress = stack.readAddress();
        expect(jettonMinterAddress.toRawString()).toEqual(jettonMinter.address.toRawString());
    });
    test.skip("dedust pool creation", async () => {
        const asset = Asset.jetton(jettonMinter.address);
        const assets: [Asset, Asset] = [Asset.native(), asset];
        // Creating a pool for our freshly deployed jetton
        await factory.sendCreateVault(deployer.getSender(), { asset });

        // Boilerplate from dedust docs for pool creation; maybe pool readiness status is not necessary to check?
        const pool = blockchain.openContract(
            await factory.getPool(PoolType.VOLATILE, assets),
        );
        const poolReadiness = await pool.getReadinessStatus();
        if (poolReadiness === ReadinessStatus.NOT_DEPLOYED) {
            console.log(`deploying new pool [ton, custom jetton]...`);
            await factory.sendCreateVolatilePool(deployer.getSender(), { assets });
        }

        const targetTonBalance = toNano("5");
        const targetJettonBalance = toNano("100");
        const targetBalances: [bigint, bigint] = [targetTonBalance, targetJettonBalance];

        const tonVault = blockchain.openContract(await factory.getNativeVault());
        await tonVault.sendDepositLiquidity(deployer.getSender(), {
            poolType: PoolType.VOLATILE,
            assets,
            targetBalances,
            amount: targetTonBalance,
        });

        const derivedJettonRoot = blockchain.openContract(JettonRoot.createFromAddress(jettonMinter.address));
        const derivedJettonDeployerWallet = await userWallet(deployer.address);
        const derivedJettonVault = await factory.getJettonVault(derivedJettonRoot.address);
        console.log(`derived user vault address: ${derivedJettonVault.address}`);

        const vaultStatus = await blockchain.openContract(derivedJettonVault).getReadinessStatus();
        const transferResult = await derivedJettonDeployerWallet.sendTransfer(
            deployer.getSender(),
            toNano("0.5"),
            targetJettonBalance,
            derivedJettonVault.address,
            deployer.address,
            null,
            toNano("0.4"),
            VaultJetton.createDepositLiquidityPayload({
                poolType: PoolType.VOLATILE,
                assets,
                targetBalances,
            }),
        );
        expect(transferResult.transactions).toHaveTransaction({
            op: Op.transfer,
            on: derivedJettonDeployerWallet.address
        });
        expect(transferResult.transactions).toHaveTransaction({
            op: Op.internal_transfer,
            on: (await userWallet(derivedJettonVault.address)).address
        });

        const poolReadinessAfter = await pool.getReadinessStatus();
        const vaultReadinessAfter = await pool.getReadinessStatus();
        assert(vaultReadinessAfter === ReadinessStatus.READY, `vault for custom jetton has status \"${vaultReadinessAfter}\" instead of \"ready\"`);
        assert(poolReadinessAfter === ReadinessStatus.READY, `pool [ton, custom jetton] has status \"${poolReadinessAfter}\" instead of \"ready\"`);

        const balanceBeforeSwap = await derivedJettonDeployerWallet.getJettonBalance();
        await tonVault.sendSwap(deployer.getSender(), {
            poolAddress: pool.address,
            amount: toNano("2"),
            gasAmount: toNano("0.25"),
        });
        const balanceAfterSwap = await derivedJettonDeployerWallet.getJettonBalance();
        assert(balanceBeforeSwap < balanceAfterSwap, `the post-swap balance (${balanceAfterSwap}) should increase compared to ${balanceBeforeSwap}`);
        console.log(`swap result: ${balanceAfterSwap - balanceBeforeSwap} nano-jettons`);


        // Withdraw-liquidity code, but in fact we can use it to send on EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c
        // const lpWallet = blockchain.openContract(await pool.getWallet(chief.address));
        // await lpWallet.sendBurn(chief.getSender(), toNano('0.5'), {
        //     amount: await lpWallet.getBalance(),
        // });
    }, 100000);
});

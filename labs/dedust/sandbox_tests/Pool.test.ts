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

describe("JettonWallet", () => {
    let jwallet_code = new Cell();
    let minter_code = new Cell();
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jettonMinter: SandboxContract<JettonMinter>;
    let userWallet: (address: Address) => Promise<SandboxContract<JettonWallet>>;
    let defaultContent: JettonMinterContent;

    // DeDust utilities
    let factory: SandboxContract<Factory>;

    beforeAll(async () => {
        minter_code = await compile("JettonMinter");

        blockchain = await Blockchain.create({
            storage: new RemoteBlockchainStorage(wrapTonClient4ForRemote(new TonClient4({
                endpoint: await getHttpV4Endpoint({ network: "mainnet" }),
            })))
        });
        deployer = await blockchain.treasury("deployer", { balance: toNano("1000") });
        defaultContent = {
            uri: "https://some_stablecoin.org/meta.json"
        };

        blockchain.now = Math.floor(Date.now() / 1000);

        jettonMinter = blockchain.openContract(
            JettonMinter.createFromConfig(
                {
                    admin: deployer.address,
                    wallet_code: jwallet_code,
                    jetton_content: jettonContentToCell(defaultContent)
                },
                minter_code));
        userWallet = async (address: Address) => blockchain.openContract(
            JettonWallet.createFromAddress(
                await jettonMinter.getWalletAddress(address)
            )
        );

    }, 20000);
    test("correct context", async () => {
        factory = blockchain.openContract(
            Factory.createFromAddress(MAINNET_FACTORY_ADDR)
        );
        const scaleAddress = Address.parse("EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE");
        const scaleVaultAddress = await factory.getVaultAddress(Asset.jetton(scaleAddress));
        console.log(`$SCALE vault address: ${Address.normalize(scaleVaultAddress)}`);
    }, 20000);
    test("minting jettons", async () => {
        const mintTxRes = await jettonMinter.sendMint(deployer.getSender(), deployer.address, toNano("1000"));
        expect(mintTxRes.transactions).toHaveTransaction({
            op: Op.internal_transfer,
            on: (await userWallet(deployer.address)).address,
            success: true,
            deploy: true
        });
    }, 20000);
    test("dedust pool creation🤡", async () => {
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
            console.log(`deploying new pool [ton, custom jetton]...`)
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
        const derivedJettonChiefWallet = blockchain.openContract(await derivedJettonRoot.getWallet(deployer.address));
        const derivedJettonVault = await factory.getJettonVault(derivedJettonRoot.address);
        await derivedJettonChiefWallet.sendTransfer(deployer.getSender(), toNano("0.5"), {
            amount: targetJettonBalance,
            destination: derivedJettonVault.address,
            responseAddress: deployer.address,
            forwardAmount: toNano("0.4"),
            forwardPayload: VaultJetton.createDepositLiquidityPayload({
                poolType: PoolType.VOLATILE,
                assets,
                targetBalances,
            }),
        });
        const poolReadinessAfter = await pool.getReadinessStatus();
        const vaultReadinessAfter = await pool.getReadinessStatus();
        assert((await tonVault.getReadinessStatus()) === ReadinessStatus.READY, `vault for custom jetton has status \"${vaultReadinessAfter}\" instead of \"ready\"`);
        assert((await pool.getReadinessStatus()) === ReadinessStatus.READY, `pool [ton, custom jetton] has status \"${poolReadinessAfter}\" instead of \"ready\"`);
        await tonVault.sendSwap(deployer.getSender(), {
            poolAddress: pool.address,
            amount: toNano("2"),
            gasAmount: toNano("0.25"),
        });

        // Withdraw-liquidity code, but in fact we can use it to send on EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c
        // const lpWallet = blockchain.openContract(await pool.getWallet(chief.address));
        // await lpWallet.sendBurn(chief.getSender(), toNano('0.5'), {
        //     amount: await lpWallet.getBalance(),
        // });
    }, 20000);
});

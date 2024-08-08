import {Blockchain, SandboxContract, TreasuryContract, RemoteBlockchainStorage, wrapTonClient4ForRemote} from '@ton/sandbox';
import {jettonContentToCell, JettonMinter, JettonMinterContent} from '../wrappers/JettonMinter';
import {Asset, Factory, MAINNET_FACTORY_ADDR} from "@dedust/sdk";
import {getHttpV4Endpoint} from '@orbs-network/ton-access';
import {TonClient4, WalletContractV3R2} from "@ton/ton";
import {findTransactionRequired} from '@ton/test-utils';
import {JettonWallet} from '../wrappers/JettonWallet';
import {Cell, toNano, Address} from '@ton/core';
import {compile} from '@ton/blueprint';

describe('JettonWallet', () => {
    let jwallet_code = new Cell();     // library cell with reference to jwallet_code_raw
    let minter_code = new Cell();
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let jettonMinter: SandboxContract<JettonMinter>;
    let userWallet: (address: Address) => Promise<SandboxContract<JettonWallet>>;
    let defaultContent: JettonMinterContent;

    // DeDust utilities
    let factory: SandboxContract<Factory>;


    beforeAll(async () => {
        minter_code = await compile('JettonMinter');

        blockchain = await Blockchain.create({
            storage: new RemoteBlockchainStorage(wrapTonClient4ForRemote(new TonClient4({
                endpoint: await getHttpV4Endpoint({network: "mainnet"}),
            })))
        });
        deployer = await blockchain.treasury('deployer');
        defaultContent = {
            uri: 'https://some_stablecoin.org/meta.json'
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

    });

    // implementation detail
    it('should deploy', async () => {
        const deployResult = await jettonMinter.sendDeploy(deployer.getSender(), toNano('10'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: jettonMinter.address,
            deploy: true,
        });
        // Make sure it didn't bounce
        expect(deployResult.transactions).not.toHaveTransaction({
            on: deployer.address,
            from: jettonMinter.address,
            inMessageBounced: true
        });
    });
    // implementation detail
    it('minter admin should be able to mint jettons', async () => {
        // can mint from deployer
        let initialTotalSupply = await jettonMinter.getTotalSupply();
        const deployerJettonWallet = await userWallet(deployer.address);
        let initialJettonBalance = toNano('1000.23');
        const mintResult = await jettonMinter.sendMint(deployer.getSender(), deployer.address, initialJettonBalance, null, null, null, toNano('0.05'), toNano('1'));

        const _mintTx = findTransactionRequired(mintResult.transactions, {
            from: jettonMinter.address,
            to: deployerJettonWallet.address,
            deploy: true,
            success: true
        });
        /*
         * No excess in this jetton
        expect(mintResult.transactions).toHaveTransaction({ // excesses
            from: deployerJettonWallet.address,
            to: jettonMinter.address
        });
        */
        deployer = await blockchain.treasury('deployer');

        const scaleAddress = Address.parse("EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE");
        factory = blockchain.openContract(
            Factory.createFromAddress(MAINNET_FACTORY_ADDR)
        );

        const scaleVaultAddress = await factory.getVaultAddress(Asset.jetton(scaleAddress));
        console.log(`$SCALE vault address: ${Address.normalize(scaleVaultAddress)}`);

        await factory.sendCreateVault(deployer.getSender(), {
            asset: Asset.jetton(jettonMinter.address),
        });

        const newVaultAddress = await factory.getVaultAddress(Asset.jetton(jettonMinter.address));
        console.log(`New vault address: ${Address.normalize(newVaultAddress)}`);


        // Optionally, you could also check the state of the vault if needed
        // const vaultState = await blockchain.getContract(scaleVaultAddress);
        // console.log(vaultState);
        // expect(vaultState).toBeDefined(); // Adjust based on the expected structure
    });
});

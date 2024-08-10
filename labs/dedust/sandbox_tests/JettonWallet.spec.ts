import {
  Blockchain,
  RemoteBlockchainStorage,
  SandboxContract,
  TreasuryContract,
  wrapTonClient4ForRemote
} from '@ton/sandbox';
import {jettonContentToCell, JettonMinter, JettonMinterContent} from '../wrappers/JettonMinter';
import {Asset, Factory, MAINNET_FACTORY_ADDR} from "@dedust/sdk";
import {getHttpV4Endpoint} from '@orbs-network/ton-access';
import {TonClient4} from "@ton/ton";
import {JettonWallet} from '../wrappers/JettonWallet';
import {Address, Cell} from '@ton/core';
import {compile} from '@ton/blueprint';

describe('JettonWallet', () => {
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

    it('integration with DeDust', async () => {
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
    });
});

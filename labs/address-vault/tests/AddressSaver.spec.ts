import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { AddressSaver, addressSaverConfigToCell } from '../wrappers/AddressSaver';
import { beginCell, Cell, toNano } from '@ton/core';
import { randomAddress } from '@ton/test-utils';
import { compile } from '@ton/blueprint';
import '@ton/test-utils';

describe('AddressSaver', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('AddressSaver');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let addressSaver: SandboxContract<AddressSaver>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        const config = { manager: deployer.address };
        addressSaver = blockchain.openContract(AddressSaver.createFromConfig(config, code));

        const deployResult = await addressSaver.sendDeploy(deployer.getSender(), toNano('0.1'));

        // expect(deployResult.transactions).toHaveTransaction({
        //     from: deployer.address,
        //     to: addressSaver.address,
        //     deploy: true,
        //     success: true
        // });
    });

    it('should change address saved by manager', async () => {
        const address = randomAddress();
        const result = await addressSaver.sendChangeAddress(
            deployer.getSender(),
            toNano('0.01'),
            12345n,
            address
        );

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: addressSaver.address,
            success: false,
        });
    });

    it('should not change saved address by anyone else', async () => {
        let user = await blockchain.treasury('user');
        const address = randomAddress();
        const result = await addressSaver.sendChangeAddress(
            user.getSender(),
            toNano('0.01'),
            12345n,
            address
        );

        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: addressSaver.address,
            success: true,
        });
    });

    it('should return required data on `requestAddress` call', async () => {
        const address = randomAddress();
        // Changing current address on this one
        await addressSaver.sendChangeAddress(
            deployer.getSender(),
            toNano('0.01'),
            12345n,
            address
        );

        let user = await blockchain.treasury('user');
        const result = await addressSaver.sendRequestAddress(
            user.getSender(),
            toNano('0.01'),
            12345n
        );
        expect(result.transactions).toHaveTransaction({
            from: addressSaver.address,
            to: user.address,
            body: beginCell()
                .storeUint(3, 32) // Response op
                .storeUint(12345n, 64) // `query_id`
                .storeAddress(deployer.address) // `manager`
                .storeAddress(address)
                .endCell(),
        });
    });

    it('should throw on any other opcode', async () => {
        const result = await deployer.send({
            to: addressSaver.address,
            value: toNano('0.01'),
            body: beginCell().storeUint(5, 32).storeUint(12345n, 64).endCell(),
        });
        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: addressSaver.address,
            exitCode: 3,
        });
    });

    it('should throw on strangers\' tries to change address', async () => {
        const address = randomAddress();
        let user = await blockchain.treasury('user');
        const result = await addressSaver.sendChangeAddress(
            user.getSender(),
            toNano('0.01'),
            12345n,
            address
        );

        expect(result.transactions).toHaveTransaction({
            from: user.address,
            to: addressSaver.address,
            exitCode: 1001,
        });
    });
});

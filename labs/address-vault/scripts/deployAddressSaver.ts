import { Address, toNano, Transaction } from '@ton/core';
import { AddressSaver } from '../wrappers/AddressSaver';
import { compile, NetworkProvider } from '@ton/blueprint';
import { TonClient } from '@ton/ton';

export async function run(provider: NetworkProvider) {
    const providerAddress = provider.sender().address;
    console.log(`Provider address: ${providerAddress}`);
    const senderAddress = providerAddress
        ? providerAddress
        : Address.parse('0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw');
    // const addressSaver = provider.open(AddressSaver.createFromConfig(
    //     { manager: senderAddress },
    //     await compile('AddressSaver')
    // ));
    //
    // await addressSaver.sendDeploy(provider.sender(), toNano('0.05'));
    //
    // await provider.waitForDeploy(addressSaver.address);
    //
    // await addressSaver.sendRequestAddress(provider.sender(), toNano(0.02), 12345n);

    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: '588cb5d0c59bdcee3f1f7810ff13284b7d89aa481481c02843587c6b43e07e82',
    });

    const transactions: Transaction[] = await client.getTransactions(senderAddress, {
        limit: 5,
    });

    console.log(transactions);
}

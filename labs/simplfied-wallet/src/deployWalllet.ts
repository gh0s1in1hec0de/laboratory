import {compileContract, getWalletMnemonic, promptUser, DEFAULT_SUB_WALLET} from "./utils";
import {Address, beginCell, Cell, toNano} from '@ton/core';
import {mnemonicToWalletKey, sign} from "@ton/crypto";
import {TonClient} from "@ton/ton";

async function main() {
    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: '588cb5d0c59bdcee3f1f7810ff13284b7d89aa481481c02843587c6b43e07e82',
    });

    const compilationResult = await compileContract(['wallet_v3.fc']);
    const codeCell = Cell.fromBoc(Buffer.from(compilationResult.codeBoc, "base64"))[0]; // get buffer from base64 encoded BOC and get cell from this buffer

    console.log(`Code BOC: ${compilationResult.codeBoc}`);
    console.log(`\nHash: ${codeCell.hash().toString('base64')}`); // get the hash of cell and convert in to base64 encoded string. We will need it further

    const keyPair = await mnemonicToWalletKey(await getWalletMnemonic(false)); // extract private and public keys from mnemonic

    const dataCell = beginCell()
        .storeUint(0, 32) // Seqno
        .storeUint(DEFAULT_SUB_WALLET, 32) // Subwallet ID
        .storeBuffer(keyPair.publicKey) // Public Key
        .endCell();

    const stateInit = beginCell()
        .storeBit(0) // No split_depth
        .storeBit(0) // No special
        .storeBit(1) // We have code
        .storeRef(codeCell)
        .storeBit(1) // We have data
        .storeRef(dataCell)
        .storeBit(0) // No library
        .endCell();

    const contractAddress = new Address(0, stateInit.hash()); // get the hash of stateInit to get the address of our smart contract in workchain with ID 0
    console.log(`Contract address: ${contractAddress.toString()}`); // output contract address to console

    const answer = await promptUser('Continue? (Y/n) ');
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') return;

    const internalMessageBody = beginCell()
        .storeUint(0, 32)
        .storeStringTail("Deployment")
        .endCell();

    const internalMessage = beginCell()
        .storeUint(0x10, 6) // no bounce
        .storeAddress(Address.parse(`0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw`))
        .storeCoins(toNano("0.03"))
        .storeUint(1, 1 + 4 + 4 + 64 + 32 + 1 + 1) // We store 1 that means we have body as a reference
        .storeRef(internalMessageBody)
        .endCell();

    // transaction for our wallet
    const toSign = beginCell()
        .storeUint(DEFAULT_SUB_WALLET, 32)
        .storeUint(Math.floor(Date.now() / 1e3) + 60, 32)
        .storeUint(0, 32) // We put seqno = 0, because after deploying wallet will store 0 as seqno
        .storeUint(3, 8)
        .storeRef(internalMessage);

    const signature = sign(toSign.endCell().hash(), keyPair.secretKey);
    const body = beginCell()
        .storeBuffer(signature)
        .storeBuilder(toSign)
        .endCell();

    const externalMessage = beginCell()
        .storeUint(0b10, 2) // indicate that it is an incoming external transaction
        .storeUint(0, 2) // src -> addr_none
        .storeAddress(contractAddress)
        .storeCoins(0) // Import fee
        .storeBit(1) // We have State Init
        .storeBit(1) // We store State Init as a reference
        .storeRef(stateInit) // Store State Init as a reference
        .storeBit(1) // We store Message Body as a reference
        .storeRef(body) // Store Message Body as a reference
        .endCell();

    await client.sendFile(externalMessage.toBoc());
}

main().finally(() => console.log("Exiting..."));


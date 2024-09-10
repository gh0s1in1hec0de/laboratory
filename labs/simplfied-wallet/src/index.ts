import {clientApiKey, getWalletMnemonic, DEFAULT_SUB_WALLET} from "./utils";
import { mnemonicToWalletKey, sign } from '@ton/crypto';
import {Address, beginCell, toNano} from "@ton/core";
import { TonClient } from '@ton/ton';

const MY_PERSONAL_WALLET_ADDRESS = "0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw";
const DEPLOYED_WALLET_ADDRESS = "EQBn6Uv-bz_8iG0K1AjuPxtXW70NbSzi68SCcZHzDaz-rpnB";

async function main() {
    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: await clientApiKey(),
    });

    // In perspective, address can be derived from init state
    const internalMessageBody = beginCell()
        .storeUint(0, 32) // write 32 zero bits to indicate that a text comment will follow
        .storeStringTail(`Regular message from ${Date.now()}`) // write our text comment
        .endCell();

    // Actual internal message, that is gonna be sent from wallet
    let internalMessage = beginCell()
        .storeUint(0, 1) // indicate that it is an internal message -> int_msg_info$0
        .storeBit(1) // IHR Disabled
        .storeBit(1) // bounce
        .storeBit(0) // bounced
        .storeUint(0, 2) // src -> addr_none
        .storeAddress(Address.parse(MY_PERSONAL_WALLET_ADDRESS)) // destination
        .storeCoins(toNano("0.00666")) // amount
        .storeBit(0) // Extra currency
        .storeCoins(0) // IHR Fee
        .storeCoins(0) // Forwarding Fee
        .storeUint(0, 64) // Logical time of creation
        .storeUint(0, 32) // UNIX time of creation
        .storeBit(0) // No State Init
        .storeBit(1) // We store Message Body as a reference
        .storeRef(internalMessageBody) // Store Message Body as a reference
        .endCell();

    const getMethodResult = await client.runMethod(Address.parse(DEPLOYED_WALLET_ADDRESS), "seqno"); // run "seqno" GET method from your wallet contract
    const seqno = getMethodResult.stack.readNumber(); // get seqno from response
    console.log(`seqno ${seqno}`);

    const keyPair = await mnemonicToWalletKey(await getWalletMnemonic(false));

    // Message, that is being built for wallet (subwallet_id, seqno, etc... is necessary fields for secure tx handling)
    let toSign = beginCell()
        .storeUint(DEFAULT_SUB_WALLET, 32)
        .storeUint(Math.floor(Date.now() / 1e3) + 60, 32) // Transaction expiration time, +60 = 1 minute
        .storeUint(seqno, 32) // store seqno
        .storeUint(3, 8) // store mode of our internal transaction
        .storeRef(internalMessage); // store our internalMessage as a reference

    let signature = sign(toSign.endCell().hash(), keyPair.secretKey);

    // Actual message, that is gonna be parsed by wallet
    let body = beginCell()
        .storeBuffer(signature) // store signature
        .storeBuilder(toSign) // store our message
        .endCell();
    // Building an external message, but all the information is necessary only for validators
    let externalMessage = beginCell()
        .storeUint(0b10, 2) // 0b10 -> 10 in binary
        .storeUint(0, 2) // src -> addr_none
        .storeAddress(Address.parse(DEPLOYED_WALLET_ADDRESS)) // Destination address
        .storeCoins(0) // Import Fee
        .storeBit(0) // No State Init
        .storeBit(1) // We store Message Body as a reference
        .storeRef(body) // Store Message Body as a reference
        .endCell();

    const bagOfCells = externalMessage.toBoc();
    console.log(`Final base64 message: ${bagOfCells.toString("base64")}`)
    await client.sendFile(bagOfCells);
}

main().finally(() => {
    console.log("Exiting...");
    process.exit(0);
});

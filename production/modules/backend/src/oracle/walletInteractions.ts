import { type Coins, DEFAULT_SUB_WALLET } from "starton-periphery";
import { mnemonicToWalletKey, sign } from "@ton/crypto";
import { balancedTonClient } from "./api.ts";
import { beginCell, Cell } from "@ton/core";
import { Address } from "@ton/ton";

// TODO Maybe simplify with wallet contract
export async function sendToWallet(wallet: {
    address: Address,
    mnemonic: string[],
}, internalMessage: Cell, sendingMode: number = 3): Promise<void> {
    const seqnoResponse = await balancedTonClient.execute(c => c.runMethod(wallet.address, "seqno"));
    const seqno = seqnoResponse.stack.readNumber();
    const keyPair = await mnemonicToWalletKey(wallet.mnemonic);

    // Message, that is being built for wallet (subwallet_id, seqno, etc... is necessary fields for secure tx handling)
    const toSign = beginCell()
        .storeUint(DEFAULT_SUB_WALLET, 32) // TODO Confirm
        .storeUint(Math.floor(Date.now() / 1e3) + 60, 32) // Will expire in 1 minute
        .storeUint(seqno, 32) // store seqno
        // Sending message mode: pay transfer fees separately + ignore some errors arising while processing this message during the action phase
        .storeUint(sendingMode, 8)
        .storeRef(internalMessage); // store our internalMessage as a reference
    // Actual message, that is gonna be parsed by wallet
    const signature = sign(toSign.endCell().hash(), keyPair.secretKey);
    const body = beginCell()
        .storeBuffer(signature)
        .storeBuilder(toSign)
        .endCell();
    // Building an external message, but all the information is necessary only for validators
    const externalMessage = beginCell()
        .storeUint(0b10, 2) // 10 in binary
        .storeUint(0, 2) // addr_none
        .storeAddress(wallet.address) // Destination address
        .storeCoins(0) // Import Fee
        .storeBit(0) // No State Init
        .storeBit(1) // Message Body as a reference
        .storeRef(body)
        .endCell();
    const bagOfCells = externalMessage.toBoc();
    await balancedTonClient.execute(c => c.sendFile(bagOfCells));
}

export function buildInternalMessage(destination: Address, amount: Coins, body: Cell): Cell {
    return beginCell()
        .storeUint(0, 1) // internal message constructor bit -> int_msg_info$0
        .storeBit(1) // IHR Disabled
        .storeBit(1) // Bounceable
        .storeBit(0) // Was bounced
        .storeUint(0, 2) // src -> addr_none
        .storeAddress(destination)
        .storeCoins(amount) // Amount
        .storeBit(0) // Extra currency
        .storeCoins(0) // IHR Fee
        .storeCoins(0) // Forwarding Fee
        .storeUint(0, 64) // Logical time of creation
        .storeUint(0, 32) // Unix time of creation
        .storeBit(0) // No state init
        .storeBit(1) // We store body as a reference
        .storeRef(body)
        .endCell();
}
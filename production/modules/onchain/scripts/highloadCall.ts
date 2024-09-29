import { internal as internal_relaxed } from "@ton/core/dist/types/_helpers";
import { DEFAULT_TIMEOUT, SUBWALLET_ID } from "starton-periphery";
import { HighloadWalletV3 } from "../wrappers/HighloadWalletV3";
import { Address, beginCell, toNano } from "@ton/core";
import { mnemonicToWalletKey } from "@ton/crypto";
import { SendMode, TonClient } from "@ton/ton";
import dotenv from "dotenv";

dotenv.config();
const client = new TonClient({
    endpoint: `https://testnet.toncenter.com/api/v2/jsonRPC`,
    apiKey: process.env.TONCENTER_API_KEY!,
    timeout: 20000
});

// The app's code is its configuration - shout out to suckless.org folks
async function main() {
    const mnemonic = process.env.HIGHLOAD_MNEMONIC!;
    const keyPair = await mnemonicToWalletKey(mnemonic.split(" "));

    const wallet = client.open(
        HighloadWalletV3.createFromAddress(
            Address.parse("0QBK4zTJLd16yMJmJVrtheEZFXQUPtocrA1OGTApws0GwJub")
        )
    );
    await wallet.sendBatch(keyPair.secretKey,
        [{
            type: "sendMsg",
            mode: SendMode.PAY_GAS_SEPARATELY,
            outMsg: internal_relaxed({
                to: Address.parse("0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw"),
                value: toNano("1"),
                body: beginCell()
                    .storeUint(0, 32)
                    .storeStringRefTail("Ladies and gentlemen, we got em *v*")
                    .endCell()
            }),
        }],
        SUBWALLET_ID,
        1n,
        DEFAULT_TIMEOUT,
    );
}

main().then();

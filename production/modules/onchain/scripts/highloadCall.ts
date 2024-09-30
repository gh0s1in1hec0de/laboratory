import { internal as internal_relaxed } from "@ton/core/dist/types/_helpers";
import { DEFAULT_TIMEOUT, SUBWALLET_ID } from "starton-periphery";
import { HighloadWalletV3 } from "../wrappers/HighloadWalletV3";
import { Address, beginCell, toNano } from "@ton/core";
import { mnemonicToWalletKey } from "@ton/crypto";
import { NetworkProvider } from "@ton/blueprint";
import { SendMode,} from "@ton/ton";
import dotenv from "dotenv";

dotenv.config();

// The app's code is its configuration - shout out to suckless.org folks
export async function run(provider: NetworkProvider) {
    const mnemonic = process.env.HIGHLOAD_MNEMONIC!;
    const keyPair = await mnemonicToWalletKey(mnemonic.split(" "));

    const wallet = provider.open(
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
                value: toNano("0.1"),
                body: beginCell()
                    .storeUint(0, 32)
                    .storeStringRefTail("1st")
                    .endCell()
            }),
        },
            {
                type: "sendMsg",
                mode: SendMode.PAY_GAS_SEPARATELY,
                outMsg: internal_relaxed({
                    to: Address.parse("0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw"),
                    value: toNano("0.1"),
                    body: beginCell()
                        .storeUint(0, 32)
                        .storeStringRefTail("2nd")
                        .endCell()
                }),
            }],
        SUBWALLET_ID,
        2n,
        DEFAULT_TIMEOUT,
    );
}
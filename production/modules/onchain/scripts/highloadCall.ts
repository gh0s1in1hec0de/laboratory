import { internal as internal_relaxed } from "@ton/core/dist/types/_helpers";
import { DEFAULT_TIMEOUT, SUBWALLET_ID } from "starton-periphery";
import { HighloadWalletV3 } from "../wrappers/HighloadWalletV3";
import { Address, beginCell, toNano } from "@ton/core";
import { mnemonicToWalletKey } from "@ton/crypto";
import { NetworkProvider } from "@ton/blueprint";
import { SendMode, } from "@ton/ton";
import dotenv from "dotenv";

dotenv.config();

// The app's code is its configuration - shout out to suckless.org folks
export async function run(provider: NetworkProvider) {
    const mnemonic = process.env.DISPENSER_MNEMONIC!;
    const keyPair = await mnemonicToWalletKey(mnemonic.split(" "));

    const wallet = provider.open(
        HighloadWalletV3.createFromAddress(
            Address.parse("0QDBO5VyGBDELTttQRi7iOSBDRC8cZ0iT0u9Z3vTD2Q567lK")
        )
    );
    await wallet.sendBatch(keyPair.secretKey,
        [
            {
                type: "sendMsg",
                mode: SendMode.NONE,
                outMsg: internal_relaxed({
                    to: Address.parse("0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw"),
                    value: toNano("0.1"),
                    body: beginCell()
                        .storeUint(0, 32)
                        .storeStringRefTail("meow")
                        .endCell()
                }),
            },
        ],
        SUBWALLET_ID,
        1002n,
        DEFAULT_TIMEOUT,
    );
}
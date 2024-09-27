import { DEFAULT_TIMEOUT, HighloadWalletV3Code, SUBWALLET_ID } from "starton-periphery";
import { HighloadWalletV3 } from "../wrappers/HighloadWalletV3";
import { mnemonicNew, mnemonicToWalletKey } from "@ton/crypto";
import { NetworkProvider } from "@ton/blueprint";
import { Address, toNano } from "@ton/core";
import dotenv from "dotenv";
dotenv.config()

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    // The app's code is its configuration - shout out to suckless.org folks
    const newMnemonic = await mnemonicNew(24);
    const keyPair = await mnemonicToWalletKey([]);

    console.info("Here is a new mnemonic phrase, write it down before proceeding: ");
    console.info(newMnemonic.join(" "));
    // if (!(await promptBool("Continue? ", ["Y", "n"], ui))) return;

    const wallet = provider.open(HighloadWalletV3.createFromAddress(Address.parse("0QBK4zTJLd16yMJmJVrtheEZFXQUPtocrA1OGTApws0GwJub")));
    wallet.sendBatch(keyPair.secretKey,
        [],
        SUBWALLET_ID,
        1n,
        DEFAULT_TIMEOUT,
    );

    ui.write(`Expected wallet address: ${wallet}`);
    await wallet.sendDeploy(provider.sender(), toNano("1"));
    ui.write("Transaction sent");
}
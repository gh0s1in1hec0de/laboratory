import { DEFAULT_TIMEOUT, HighloadWalletV3Code, SUBWALLET_ID } from "starton-periphery";
import { mnemonicNew, mnemonicToWalletKey } from "@ton/crypto";
import { compile, NetworkProvider } from "@ton/blueprint";
import { HighloadWalletV3 } from "../wrappers/HighloadWalletV3";
import { promptBool } from "./ui-utils";
import { toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    // The app's code is its configuration - shout out to suckless.org folks
    const newMnemonic = await mnemonicNew(24);
    const keyPair = await mnemonicToWalletKey(newMnemonic);

    console.info("Here is a new mnemonic phrase, write it down before proceeding: ");
    console.info(newMnemonic.join(" "));
    if (!(await promptBool("Continue? ", ["Y", "n"], ui))) return;

    const walletInstance = HighloadWalletV3.createFromConfig({
            publicKey: keyPair.publicKey,
            subwalletId: SUBWALLET_ID,
            timeout: DEFAULT_TIMEOUT
        },
        await compile("HighloadWalletV3")
    );

    const wallet = provider.open(walletInstance);
    ui.write(`Expected wallet address: ${wallet.address}`);
    await wallet.sendDeploy(provider.sender(), toNano("1"));
    ui.write("Transaction sent");
}
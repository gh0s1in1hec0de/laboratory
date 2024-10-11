import { Address, toNano } from "@ton/core";
import { JettonMaster } from "../wrappers/JettonMaster";
import { compile, NetworkProvider } from "@ton/blueprint";

export async function run(provider: NetworkProvider) {
    const jettonWalletCode = await compile("JettonWallet");

    const minter = provider.open(JettonMaster.createFromConfig({
            admin: Address.parse(""),
            supply: 0n,
            walletCode: jettonWalletCode,
            jettonContent: { uri: "" }
        },
        await compile("JettonMinter")));

    await minter.sendDeploy(provider.sender(), toNano("1.5")); // send 1.5 TON
}

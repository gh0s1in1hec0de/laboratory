import { compile, NetworkProvider } from "@ton/blueprint";
import { checkJettonMinter } from "./JettonMasterChecker";
import { Address } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const isTestnet = provider.network() !== "mainnet";

    const ui = provider.ui();

    const jettonMinterCode = await compile("JettonMinter");
    const jettonWalletCode = await compile("JettonWallet");


    // TODO
    try {
        await checkJettonMinter(Address.parse(""), jettonMinterCode, jettonWalletCode, provider, ui, isTestnet, false);
    } catch (e: any) {
        ui.write(e.message);
        return;
    }
}

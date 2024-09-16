import { jettonWalletCodeFromLibrary, promptUserFriendlyAddress } from "./ui-utils";
import { compile, NetworkProvider } from "@ton/blueprint";
import { checkJettonMinter } from "./JettonMasterChecker";

export async function run(provider: NetworkProvider) {
    const isTestnet = provider.network() !== "mainnet";

    const ui = provider.ui();

    const jettonMinterCode = await compile("JettonMinter");
    const jettonWalletCodeRaw = await compile("JettonWallet");
    const jettonWalletCode = jettonWalletCodeFromLibrary(jettonWalletCodeRaw);

    const jettonMinterAddress = await promptUserFriendlyAddress("Enter the address of the jetton minter", ui, isTestnet);

    try {
        await checkJettonMinter(jettonMinterAddress, jettonMinterCode, jettonWalletCode, provider, ui, isTestnet, false);
    } catch (e: any) {
        ui.write(e.message);
        return;
    }
}

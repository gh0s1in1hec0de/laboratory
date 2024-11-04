import { TokenLaunchV2 } from "../wrappers/TokenLaunchV2";
import { TokenLaunchV1 } from "../wrappers/TokenLaunchV1";
import { GlobalVersions } from "starton-periphery";
import { NetworkProvider } from "@ton/blueprint";
import { Address, toNano } from "@ton/core";
import { checkVersionMatch } from "./units";

const V: GlobalVersions = GlobalVersions.V2;

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tokenLaunchInstance =
        (V === GlobalVersions.V1 ? TokenLaunchV1 : TokenLaunchV2).createFromAddress(
            Address.parse("kQDV-fQ8gH1fhrNNCZ1dn_sPowp3ftorP-VFZtE7cOFzaCj1")
        );
    checkVersionMatch(V, tokenLaunchInstance);
    const tokenLaunch = provider.open(tokenLaunchInstance);

    await tokenLaunch.sendJettonClaimRequest({
        via: provider.sender(), value: toNano("0.1"), queryId: 0n
    });
    ui.write("Transaction sent");
}
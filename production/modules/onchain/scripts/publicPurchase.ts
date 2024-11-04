import { TokenLaunchV1 } from "../wrappers/TokenLaunchV1";
import { NetworkProvider } from "@ton/blueprint";
import { Address, toNano } from "@ton/core";
import { GlobalVersions } from "starton-periphery";
import { TokenLaunchV2 } from "../wrappers/TokenLaunchV2";

const V: GlobalVersions = GlobalVersions.V2;

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tokenLaunchInstance =
        (V === GlobalVersions.V1 ? TokenLaunchV1 : TokenLaunchV2).createFromAddress(
            Address.parse("kQDV-fQ8gH1fhrNNCZ1dn_sPowp3ftorP-VFZtE7cOFzaCj1") // Check twice
        );
    const tokenLaunch = provider.open(tokenLaunchInstance);

    await tokenLaunch.sendPublicPurchase({
        via: provider.sender(), value: toNano("1"), queryId: 0n
    });

    ui.write("Transaction sent");
}
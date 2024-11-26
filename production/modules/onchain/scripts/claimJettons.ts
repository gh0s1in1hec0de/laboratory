import { TokenLaunchV2 } from "../wrappers/TokenLaunchV2";
import { TokenLaunchV1 } from "../wrappers/TokenLaunchV1";
import { GlobalVersions } from "starton-periphery";
import { NetworkProvider } from "@ton/blueprint";
import { Address, toNano } from "@ton/core";
import { checkVersionMatch } from "./units";

const V: GlobalVersions = GlobalVersions.V1;

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tokenLaunchInstance =
        (V === GlobalVersions.V1 ? TokenLaunchV1 : TokenLaunchV2).createFromAddress(
            Address.parse("0:abec535475215784d06d0746fad51db844c3debef583e4d12e2f837aed6f2eb5")
        );
    checkVersionMatch(V, tokenLaunchInstance);
    const tokenLaunch = provider.open(tokenLaunchInstance);

    await tokenLaunch.sendJettonClaimRequest({
        via: provider.sender(), value: toNano("0.1"), queryId: 0n
    });
    ui.write("Transaction sent");
}
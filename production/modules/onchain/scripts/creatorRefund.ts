import { NetworkProvider } from "@ton/blueprint";
import { TokenLaunchV1 } from "../wrappers/TokenLaunchV1";
import { Address, toNano } from "@ton/core";
import { GlobalVersions } from "starton-periphery";
import { TokenLaunchV2 } from "../wrappers/TokenLaunchV2";
import { checkVersionMatch } from "./units";

const V: GlobalVersions = GlobalVersions.V2;

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tokenLaunchInstance =
        (V === GlobalVersions.V1 ? TokenLaunchV1 : TokenLaunchV2).createFromAddress(
            Address.parse("")
        );
    checkVersionMatch(V, tokenLaunchInstance);
    const tokenLaunch = provider.open(
        tokenLaunchInstance
    );

    await tokenLaunch.sendCreatorRefund({ via: provider.sender(), value: toNano("0.01"), queryId: 0n });

    ui.write("Transaction sent");
}
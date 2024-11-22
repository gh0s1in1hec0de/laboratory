import { TokenLaunchV1 } from "../wrappers/TokenLaunchV1";
import { NetworkProvider } from "@ton/blueprint";
import { getQueryId } from "starton-periphery";
import { Address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tokenLaunch = provider.open(
        TokenLaunchV1.createFromAddress(
            Address.parse("kQBWnmGq5CRmYbMw_sJKqodg2LsiY0_K73uGu-q2K-TSH1u6")
        )
    );

    await tokenLaunch.sendWhitelistPurchase({
        via: provider.sender(), value: toNano("1.5"), queryId: BigInt(getQueryId())
    });

    ui.write("Transaction sent");
}
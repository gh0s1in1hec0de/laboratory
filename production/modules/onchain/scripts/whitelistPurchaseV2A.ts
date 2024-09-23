import { TokenLaunchV2A } from "../wrappers/TokenLaunchV2A";
import { NetworkProvider } from "@ton/blueprint";
import { getQueryId } from "starton-periphery";
import { Address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    try {
        const tokenLaunch = provider.open(TokenLaunchV2A.createFromAddress(Address.parse("launch address")));

        await tokenLaunch.sendWhitelistPurchase({
            via: provider.sender(), value: toNano("value"), queryId: BigInt(getQueryId())
        });

        ui.write("Transaction sent");
    } catch (e: any) {
        ui.write(e.message);
        return;
    }
}
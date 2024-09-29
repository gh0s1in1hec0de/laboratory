import { TokenLaunchV2A } from "../wrappers/TokenLaunchV2A";
import { NetworkProvider } from "@ton/blueprint";
import { Address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    try {
        const tokenLaunch = provider.open(
            TokenLaunchV2A.createFromAddress(
                Address.parse("kQCBh8mmVQWo4zzgcIM4e4wy2T5D1pgrSCm6eCAIgWe7ozSN")
            )
        );

        await tokenLaunch.sendPublicPurchase({
            via: provider.sender(), value: toNano("1"), queryId: 0n
        });

        ui.write("Transaction sent");
    } catch (e: any) {
        ui.write(e.message);
        return;
    }
}
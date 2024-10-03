import { NetworkProvider } from "@ton/blueprint";
import { TokenLaunchV2A } from "../wrappers/TokenLaunchV2A";
import { Address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    try {
        const tokenLaunch = provider.open(
            TokenLaunchV2A.createFromAddress(
                Address.parse("kQDjycaYALIhm9jgUI6BkrkJ419TsOWxYntMN9dKJ50yu6gW")
            )
        );

        await tokenLaunch.sendCreatorRefund({ via: provider.sender(), value: toNano("0.01"), queryId: 0n });

        ui.write("Transaction sent");
    } catch (e: any) {
        ui.write(e.message);
        return;
    }
}
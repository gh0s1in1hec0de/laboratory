import { NetworkProvider } from "@ton/blueprint";
import { TokenLaunchV1 } from "../wrappers/TokenLaunchV1";
import { Address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    try {
        const tokenLaunch = provider.open(
            TokenLaunchV1.createFromAddress(
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
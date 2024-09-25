import { TokenLaunchV2A } from "../wrappers/TokenLaunchV2A";
import { NetworkProvider } from "@ton/blueprint";
import { Address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    try {
        const tokenLaunch = provider.open(
            TokenLaunchV2A.createFromAddress(
                Address.parse("kQAL-bolzo-2m0ioeZnodK1lPgLmyH6-SQgnyugWOWD6evI8")
            )
        );

        await tokenLaunch.sendCreatorBuyout({ via: provider.sender(), value: toNano("0.2"), queryId: 0n });

        ui.write("Transaction sent");
    } catch (e: any) {
        ui.write(e.message);
        return;
    }
}
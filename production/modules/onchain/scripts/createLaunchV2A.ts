import { NetworkProvider } from "@ton/blueprint";
import { LaunchParams } from "../wrappers/types";
import { CoreV2A } from "../wrappers/CoreV2A";
import { Address, toNano } from "@ton/core";

// TODO to add custom config support later
export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const params: LaunchParams = {
        startTime: Math.round(Date.now() / 1000) + 60,
        totalSupply: toNano("1000000"),
        metadata: { uri: "https://another_shitcoin.meow" },
        platformSharePct: 1500
    };
    const core = provider.open(
        CoreV2A.createFromAddress(
            Address.parse("kQBQ4brYok-qvpWfmP_J_-Rrl-ztO_Bm1CNh-FKbAfkDlkeY")
        )
    );
    await core.sendCreateLaunch({ via: provider.sender(), value: toNano("1"), queryId: 0n }, params);
    ui.write("Transaction sent");
}
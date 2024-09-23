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
        metadata: { uri: "http://another_shitcoin.meow" },
        platformSharePct: 1500
    };
    try {
        const core = provider.open(CoreV2A.createFromAddress(Address.parse("seems like here should be core address")));
        await core.sendCreateLaunch({ via: provider.sender(), value: toNano("value"), queryId: 0n }, params);
        ui.write("Transaction sent");
    } catch (e: any) {
        ui.write(e.message);
        return;
    }
}
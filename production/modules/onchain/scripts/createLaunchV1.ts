import { NetworkProvider } from "@ton/blueprint";
import { LaunchParams } from "../wrappers/types";
import { CoreV1 } from "../wrappers/CoreV1";
import { Address, toNano } from "@ton/core";

// TODO to add custom config support later
export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const params: LaunchParams = {
        startTime: Math.round(Date.now() / 1000) + 60,
        totalSupply: toNano("1000000"),
        metadata: { uri: "https://ipfs.io/ipfs/QmSKQmJb4pBTmvtGJgg93tGVH4cfh6wYK6y8h6kwpUnEnZ" },
        platformSharePct: 1500
    };
    const core = provider.open(
        CoreV1.createFromAddress(
            Address.parse("kQDJi05w0K6He5sXuyIHVstOTU3P4EVbSKtBWZDTZOQ_348O")
        )
    );
    await core.sendCreateLaunch({ via: provider.sender(), value: toNano("1"), queryId: 0n }, params);
    ui.write("Transaction sent");
}
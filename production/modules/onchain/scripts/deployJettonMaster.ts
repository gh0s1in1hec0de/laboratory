import { compile, NetworkProvider } from "@ton/blueprint";
import { JettonMaster } from "../wrappers/JettonMaster";
import { Address, toNano } from "@ton/core";
import { XmasJettonMaster } from "../wrappers/XmasJettonMaster";

export async function run(provider: NetworkProvider) {
    const master = provider.open(
        XmasJettonMaster.createFromConfig({
            admin: Address.parse("0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw"),
            supply: 0n,
            walletCode: await compile("XmasJettonWallet"),
            jettonContent: { uri: "https://storage.starton.pro/ipfs/QmUE7RQFPwDb4Na1xDEZ12TLoKqaTANDBJQoRp5T2sRnbe" }
        }, await compile("XmasJettonMaster"))
    );

    console.info(`Expected master address: ${master.address}`);
    await master.sendDeploy(provider.sender(), toNano("1"));
}

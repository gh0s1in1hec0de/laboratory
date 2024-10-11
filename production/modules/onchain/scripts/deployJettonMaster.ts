import { compile, NetworkProvider } from "@ton/blueprint";
import { JettonMaster } from "../wrappers/JettonMaster";
import { Address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const master = provider.open(JettonMaster.createFromConfig({
                admin: Address.parse("0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw"),
                supply: 0n,
                walletCode: await compile("JettonWallet"),
                jettonContent: { uri: "https://ipfs.io/ipfs/QmVCMdxyudybb9vDefct1qU3DEZBhj3zhg3n9uM6EqGbN6" }
            },
            await compile("JettonMaster"))
    );

    console.info(`Expected master address: ${master.address}`);
    await master.sendDeploy(provider.sender(), toNano("1.5"));
}

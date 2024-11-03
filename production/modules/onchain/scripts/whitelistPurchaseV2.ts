import { JettonWallet } from "../wrappers/JettonWallet";
import { jettonToNano } from "starton-periphery";
import { NetworkProvider } from "@ton/blueprint";
import { Address, toNano } from "@ton/core";
import { JettonMaster } from "@ton/ton";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();
    const callerAddress = provider.sender().address;
    if (!callerAddress) throw new Error("Can't parse sender's address");
    const utilJettonMaster = provider.open(
        JettonMaster.create(
            Address.parse("kQCRJ_NbvPCMGVIXRVU7KV8sZDmeX99uzumaAr7L5ZOMTIQz")
        )
    );
    const myWalletAddress = await utilJettonMaster.getWalletAddress(
        Address.parse("0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw")
    );
    const myWallet = provider.open(
        JettonWallet.createFromAddress(myWalletAddress)
    );

    // Don't forget to check values twice
    await myWallet.sendTransfer(
        provider.sender(),
        toNano("1"),
        jettonToNano(1),
        Address.parse("launch_address"),
        callerAddress,
        null,
        toNano("2"),
        null
    );


    ui.write("Transaction sent");
}
import { JettonMaster } from "../wrappers/JettonMaster";
import { NetworkProvider } from "@ton/blueprint";
import { jettonToNano } from "starton-periphery";
import { Address } from "@ton/core";
import { XmasJettonMaster } from "../wrappers/XmasJettonMaster";

export async function run(provider: NetworkProvider) {
    const master = provider.open(
        XmasJettonMaster.createFromAddress(
            Address.parse("EQBbySvv5mObroL5d0HlxwfANtfV_taROeorW34MXApXlUgs")
        )
    );
    await master.sendMint(provider.sender(),
        Address.parse("0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw"),
        jettonToNano(1_000_000_000)
    );
}



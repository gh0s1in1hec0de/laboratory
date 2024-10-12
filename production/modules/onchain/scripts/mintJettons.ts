import { JettonMaster } from "../wrappers/JettonMaster";
import { NetworkProvider } from "@ton/blueprint";
import { jettonToNano } from "starton-periphery";
import { Address } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const master = provider.open(
        JettonMaster.createFromAddress(
            Address.parse("kQBdx_1Vq0E6C80GtivN_Sm5Ee4vVlpfbk1h9vqP-UTZqRCm")
        )
    );
    await master.sendMint(provider.sender(),
        Address.parse("0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw"),
        jettonToNano(1_000_000_000)
    );
}



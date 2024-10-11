import { JettonMaster } from "../wrappers/JettonMaster";
import {  NetworkProvider } from "@ton/blueprint";
import { Address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const master = provider.open(
        JettonMaster.createFromAddress(Address.parse("kQB4nF5hNUsjnSYN3klFk8JrvEScRKtBF2-8W1a9ySMqg1HN"))
    );
    await master.sendMint(provider.sender(),
        Address.parse("0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw"),
        toNano("1000000000")
    );

}



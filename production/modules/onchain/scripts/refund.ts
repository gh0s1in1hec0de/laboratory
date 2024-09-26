import { TokenLaunchV2A } from "../wrappers/TokenLaunchV2A";
import { BalanceUpdateMode } from "starton-periphery";
import { NetworkProvider } from "@ton/blueprint";
import { Address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    try {
        const tokenLaunch = provider.open(TokenLaunchV2A.createFromAddress(Address.parse("kQBGx4l83ngGQqKojzMISq1fUm47hpLo9hHVKTq4nG41tnYC")));

        await tokenLaunch.sendRefundRequest({
            via: provider.sender(), value: toNano("0.1"), queryId: 0n
        }, BalanceUpdateMode.TotalWithdrawal);

        ui.write("Transaction sent");
    } catch (e: any) {
        ui.write(e.message);
        return;
    }
}
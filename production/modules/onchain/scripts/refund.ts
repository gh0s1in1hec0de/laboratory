import { BalanceUpdateMode, GlobalVersions, fees } from "starton-periphery";
import { Address, OpenedContract } from "@ton/core";
import { TokenLaunchV1 } from "../wrappers/TokenLaunchV1";
import { TokenLaunchV2 } from "../wrappers/TokenLaunchV2";
import { NetworkProvider } from "@ton/blueprint";
import { checkVersionMatch } from "./units";

const V: GlobalVersions = GlobalVersions.V1;

export async function run(provider: NetworkProvider) {
    const ui = provider.ui();

    const tokenLaunchInstance = (V === GlobalVersions.V1 ? TokenLaunchV1 : TokenLaunchV2).createFromAddress(
        Address.parse("")
    );
    checkVersionMatch(V, tokenLaunchInstance);
    const tokenLaunch: OpenedContract<TokenLaunchV1 | TokenLaunchV2> = provider.open(tokenLaunchInstance);

    await tokenLaunch.sendRefundRequest(
        { via: provider.sender(), value: fees[V].refund, queryId: 0n },
        BalanceUpdateMode.TotalWithdrawal
    );

    ui.write("Transaction sent");
}
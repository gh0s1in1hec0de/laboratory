import { BlockchainTransaction } from "@ton/sandbox";
import { Coins } from "starton-periphery";
import { fromNano } from "@ton/core";

export function formatValue(v: Coins, print: boolean = false) {
    const f = `${fromNano(v)} TONs (${v})`;
    if (print) console.log(f);
    return f;
}
export const printTxsLogs = (txs: BlockchainTransaction[], title?: string) => {
    let txIndex = 1;
    if (title) console.info(`[*] ${title}`);
    for (const tx of txs) {
        console.info(` - transaction #${txIndex}`);
        console.log(tx.vmLogs);
        txIndex += 1;
    }

};
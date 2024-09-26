import { getTransactionsForAccount, retrieveAllUnknownTransactions } from "../src/oracle";
import { Address, TonClient4, type Transaction } from "@ton/ton";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import type { RawAddressString } from "starton-periphery";
import { maybeBruteforceOverload } from "../src/utils.ts";
import { test, describe, beforeAll } from "bun:test";
import dotenv from "dotenv";

dotenv.config();

// Works with TonClient4 under the hood, includes last account's `lamport_time`
async function getAccount(c: TonClient4, address: RawAddressString, seqno?: number) {
    const seqno_ = seqno ? seqno : (await c.getLastBlock()).last.seqno;
    console.debug(`Seqno has been ${seqno ? "provided manually" : "taken from api"}: ${seqno_}`);
    // Do we really need it here?
    return maybeBruteforceOverload<any>(c.getAccount(seqno_, Address.parse(address)));
}

describe("Ton Eye", () => {
    let tonClient4Instance: TonClient4;
    let addressVaultTestnetAddress: RawAddressString;
    let printTxs: (txs: Transaction[]) => void;

    beforeAll(async () => {
        tonClient4Instance = new TonClient4({ endpoint: await getHttpV4Endpoint({ network: "testnet" }) });
        addressVaultTestnetAddress = Address.parse("EQBx3ogufv7zZlqNqvGsnhGOfsIprcyKnMEe04KSREQAEG3z").toRawString();
        printTxs = (txs) => {
            let counter = 0;
            console.log("[*] transactions: ");
            for (const tx of txs) {
                counter += 1;
                console.log(` # transaction ${tx.hash().toString("base64")}`);
                console.log(` - now: ${new Date(tx.now * 1000)}`);
                console.log(` - lt: ${tx.lt}`);
                console.log(` - prev tx lt: ${tx.prevTransactionLt}`);
                console.log();
            }
            console.log(`txs total amount: ${counter}`);
        };
    });
    test("ton api wrapper testbed", async () => {
        // Took deployed simple `address vault` from labs
        const accountEntity = await getAccount(tonClient4Instance, addressVaultTestnetAddress);

        console.log("[*] account entity: ");
        console.log(accountEntity);

        const last = accountEntity.account.last;
        if (!last) throw new Error("failed to get lt and hash");
        console.log("[*] last: ");
        console.log(last);

        const txs = await getTransactionsForAccount(addressVaultTestnetAddress,
            24121092000001n, {
                lt: 24809208000001n,
                hash: "EVkd8f4JDXl4cOOuDRS+/8pOocUY1EtOn8E3GwLiWBA="
            }, undefined, 10
        );

        // Sort transactions by 'now' in ascending order (oldest to newest)
        txs.sort((a, b) => {
            if (a.lt < b.lt) return -1;
            if (a.lt > b.lt) return 1;
            return 0;
        });
        printTxs(txs);
    });
    test("partial network scanning seamlessness", async () => {
        const address = addressVaultTestnetAddress;
        const archival = true;
        const stopAt = 24121092000001n;
        // Transactions from `{ lt, hash }` to `to_lt` parsed as one chunk
        const txsChunk = await getTransactionsForAccount(address,
            stopAt, undefined, archival, 12
        );
        txsChunk.sort((a, b) => {
            if (a.lt < b.lt) return -1;
            if (a.lt > b.lt) return 1;
            return 0;
        });

        const txsGluedChunk = await retrieveAllUnknownTransactions(
            address,
            stopAt,
            { archival, limit: 4 }
        );
        if (!txsChunk) return;

        if (txsChunk.toString() === txsGluedChunk!.toString()) {
            console.log("nice job, tx arrays are equal");
        } else {
            console.log("arrays are different: ");
            printTxs(txsChunk);
            console.log("======");
            printTxs(txsGluedChunk!);
            throw new Error("^^");
        }
    });
    test("just some temporary shit I need to check fast", async () => {

    });
});
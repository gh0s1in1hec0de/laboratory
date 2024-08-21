import { getAccount, getTransactionsForAccount, retrieveAllUnknownTransactions } from "../src/oracle/api";
import type { RawAddressString } from "starton-periphery";
import { test, describe, beforeAll } from "bun:test";
import { Address, type Transaction } from "@ton/ton";
import dotenv from "dotenv";

dotenv.config();

describe("Ton Eye", () => {
    let addressVaultTestnetAddress: RawAddressString;
    let printTxs: (txs: Transaction[]) => void;

    beforeAll(async () => {
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
        const accountEntity = await getAccount(addressVaultTestnetAddress);

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

        if (txsChunk.toString() === txsGluedChunk.toString()) {
            console.log("nice job, tx arrays are equal");
        } else {
            console.log("arrays are different: ");
            printTxs(txsChunk);
            console.log("======");
            printTxs(txsGluedChunk);

            throw new Error("^^");
        }
    });
    test("just some temporary shit I need to check fast", async () => {
        console.log(new Date(Date.now()).toString());
    });
});
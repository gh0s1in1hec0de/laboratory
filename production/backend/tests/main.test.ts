import { getAccount, getTransactionsForAccount } from "../src/oracle/api";
import { test, describe, beforeAll } from "bun:test";
import { Address } from "@ton/ton";
import dotenv from "dotenv";

dotenv.config();

describe("labs", () => {
    beforeAll(async () => {
        // TODO
    });
    test("api wrapper mechanics labs", async () => {
        // Took deployed simple `address vault` from labs
        const exampleAddress = Address.parse("EQBx3ogufv7zZlqNqvGsnhGOfsIprcyKnMEe04KSREQAEG3z").toRawString();
        const accountEntity = await getAccount(exampleAddress);

        console.log("[*] account entity: ");
        console.log(accountEntity);

        const last = accountEntity.account.last;
        if (!last) throw new Error("failed to get lt and hash");
        console.log("[*] last: ");
        console.log(last);

        const txs = await getTransactionsForAccount(exampleAddress,
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
    });
    test("partial network scanning seamlessness", async () => {
        // TODO
    });
    test("just some temporary shit I need to check fast", async () => {
        console.log(new Date(Date.now()).toString());
    });
});
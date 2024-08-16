import {test, describe} from "bun:test";
import {getAccount, getTransactionsForAccount} from "../src/oracle";
import {Address} from "@ton/ton";
import dotenv from "dotenv";

dotenv.config();

describe("labs", () => {
    test("results of network scanning", async () => {
        // Took deployed simple `address vault` from labs
        const exampleAddress = Address.parse("EQBx3ogufv7zZlqNqvGsnhGOfsIprcyKnMEe04KSREQAEG3z");
        const accountEntity = await getAccount(exampleAddress);

        console.log(`[*] account entity: `);
        console.log(accountEntity);

        const last = accountEntity.account.last;
        if (!last) throw new Error("failed to get lt and hash");
        console.log(`[*] last: `);
        console.log(last);

        const txs = await getTransactionsForAccount(exampleAddress,
            "24809208000001",
            "EVkd8f4JDXl4cOOuDRS+/8pOocUY1EtOn8E3GwLiWBA=",
            "24120614000001", // "24120614000001",
            true,
            100
        );

        // Sort transactions by 'now' in ascending order (oldest to newest)
        txs.sort((a, b) => {
            return Number(a.lt - b.lt) // return a.now - b.now;
        });

        let counter = 0;
        console.log(`[*] transactions: `);
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
});
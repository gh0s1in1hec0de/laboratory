import {test, describe} from "bun:test";
import {Address, TonClient} from "@ton/ton";
import {TonEye} from "../src/oracle/actors.ts";
import {Network} from "../src/utils.ts";
import dotenv from "dotenv";

dotenv.config();

describe("labs", () => {
    test("results of network scanning", async () => {
        // Took deployed simple `address vault` from labs
        const exampleAddress = Address.parse("EQBx3ogufv7zZlqNqvGsnhGOfsIprcyKnMEe04KSREQAEG3z");
        const tonEye = await TonEye.raise(Network.Testnet, process.env.TONCENTER_TESTNET_API_KEY!);
        const accountEntity = await tonEye.getAccount(exampleAddress);

        console.log(`[*] account entity: `);
        console.log(accountEntity);

        const last = accountEntity.account.last;
        if (!last) throw new Error("failed to get lt and hash");
        console.log(`[*] last: `);
        console.log(last);

        const txs = await tonEye.getTransactionsForAccount(exampleAddress, {
            lt: last.lt,
            hash: last.hash,
            limit: 10,
            archival: true,
            to_lt: "0" // "24809880000001"
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
        console.log(counter)
    });
});
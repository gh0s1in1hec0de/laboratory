import { Address, TonClient, TonClient4, type Transaction, JettonMaster } from "@ton/ton";
import {
    parseJettonMetadata,
    type RawAddressString,
    retrieveAllUnknownTransactions
} from "starton-periphery";
import { test, describe, beforeAll } from "bun:test";
import dotenv from "dotenv";

dotenv.config();

// Works with TonClient4 under the hood, includes last account's `lamport_time`
async function getAccount(c: TonClient4, address: RawAddressString, seqno?: number) {
    const seqno_ = seqno ? seqno : (await c.getLastBlock()).last.seqno;
    console.debug(`Seqno has been ${seqno ? "provided manually" : "taken from api"}: ${seqno_}`);
    // Do we really need it here?
    return c.getAccount(seqno_, Address.parse(address));
}

describe("Ton Eye", () => {
    let tonClientInstance: TonClient;
    let tonClient4Instance: TonClient4;
    let addressVaultTestnetAddress: RawAddressString;
    let printTxs: (txs: Transaction[]) => void;

    beforeAll(async () => {
        tonClientInstance = new TonClient({
            endpoint: "https://toncenter.com/api/v2/jsonRPC",
            apiKey: "867e7c7e9a1655809100a503744da279f4da6e235b600c469cafd746fe4d58c2",
            timeout: 20000
        });
        // tonClient4Instance = new TonClient4({ endpoint: await getHttpV4Endpoint({ network: "testnet" }) });
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
    test.skip("ton api wrapper testbed", async () => {
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
    test.skip("partial network scanning seamlessness", async () => {
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
    test("jetton metadata parsing", async () => {
        const jettonContract = tonClientInstance.open(
            JettonMaster.create(
                Address.parse("EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs")
            )
        );
        const { content } = await jettonContract.getJettonData();
        console.log(await parseJettonMetadata(content));
    });
});
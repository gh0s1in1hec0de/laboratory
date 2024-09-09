import { Address, TonClient, TonClient4, type Transaction, type TupleItem } from "@ton/ton";
import type { LamportTime, RawAddressString } from "starton-periphery";
import { currentNetwork, mainnetKeys, testnetKeys } from "../config";
import { delay, maybeBruteforceOverload, Network } from "../utils";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { logger } from "../logger";

// RR bitch (RoundRobin, not Rolls-Royce)
class BalancedTonClient {
    private readonly keys: string[];
    private currentKeyIndex: number;
    private activeLaunchesNumber: number;

    constructor(network: Network) {
        this.currentKeyIndex = 0;
        this.activeLaunchesNumber = 0;
        this.keys = network == Network.Testnet ? testnetKeys() : mainnetKeys();
    }

    get() {
        if (this.currentKeyIndex < this.keys.length - 1) this.currentKeyIndex += 1;
        else this.currentKeyIndex = 0;
        const apiKey = this.keys[this.currentKeyIndex];
        logger().debug(` - tonclient apikey for operation: ${apiKey}`);
        return new TonClient({
            endpoint: `https://${currentNetwork() === "testnet" ? "testnet." : ""}toncenter.com/api/v2/jsonRPC`,
            apiKey
        });
    }

    incrementActiveLaunchesAmount() {
        this.activeLaunchesNumber += 1;
    }
    decrementActiveLaunchesAmount() {
        this.activeLaunchesNumber -= 1;
    }
    delay() {
        // Are you ready for dumb code?
        if (this.activeLaunchesNumber < 10) return 10000;
        else return 20000;
    }
}

export const balancedTonClient = new BalancedTonClient(currentNetwork() as Network);
const tonClient4 = new TonClient4({ endpoint: await getHttpV4Endpoint({ network: currentNetwork() as Network }) });

// Works with TonClient4 under the hood, includes last account's `lamport_time`
export async function getAccount(address: RawAddressString, seqno?: number) {
    const seqno_ = seqno ? seqno : (await tonClient4.getLastBlock()).last.seqno;
    logger().debug(`Seqno has been ${seqno ? "provided manually" : "taken from api"}: ${seqno_}`);
    // Do we really need it here?
    return maybeBruteforceOverload<any>(tonClient4.getAccount(seqno_, Address.parse(address)));
}

// Limited to 100 transactions per request by TonCenter;
//
// When lt and hash are set to transaction x, parsing begins from the transaction immediately following `x`, excluding `x` itself.
export async function getTransactionsForAccount(address: RawAddressString, to_lt?: LamportTime, from?: {
    lt: LamportTime,
    hash: string,
}, archival = true, limit = 100) {
    return await maybeBruteforceOverload<Transaction[]>(
        balancedTonClient.get().getTransactions(Address.parse(address), {
            limit,
            lt: from?.lt?.toString(),
            hash: from?.hash,
            to_lt: to_lt?.toString(),
            archival
        })
    );
}

// [ { type: 'slice', cell: beginCell().storeAddress(myAddress).endCell() } ]
//
// .stack.readAddress();
export async function callGetMethod(callee: Address, method: string, stack?: TupleItem[]) {
    return balancedTonClient.get().runMethod(callee, method, stack);
}

// `stopAt` is lamport time of last known tx; returns an array of new transactions oldest -> the newest
//
// Warning! Function may throw and error - this case should be properly handled
export async function retrieveAllUnknownTransactions(
    address: RawAddressString,
    stopAt: LamportTime,
    parsingOptions?: {
        archival: boolean,
        limit: number,
    }
): Promise<Transaction[]> {
    logger().debug(`[*] ${retrieveAllUnknownTransactions.name}`); // THIS CODE IS A FUCKING JOKE BTW
    logger().debug(` - start txs parsing for account ${address} from ${stopAt}`);
    const newTransactions: Transaction[] = [];
    const limit = parsingOptions?.limit ?? 100;
    let startFrom: { lt: LamportTime, hash: string } | undefined = undefined;

    let iterationIndex = 1;
    while (true) {
        if (iterationIndex > 1) {
            logger().warn(`exceeded update limit(${limit} per request) for address ${address} at ${new Date(Date.now()).toString()}`);
            await delay(750);
        }

        const transactions = await getTransactionsForAccount(address, stopAt, startFrom, parsingOptions?.archival, parsingOptions?.limit);

        if (transactions.length === 0) break;
        newTransactions.push(...transactions);
        // TODO Safety check test
        if (transactions.length < limit) break;

        // Update our new starting point to last parsed tx
        const lastParsedTx = transactions[transactions.length - 1];
        startFrom = { lt: lastParsedTx.lt, hash: lastParsedTx.hash().toString("base64") };
        iterationIndex += 1;
    }
    // No updates happened case
    if (newTransactions.length == 0) {
        logger().debug(` - no updates for ${address}`);
        return [];
    }
    // From oldest to newest
    newTransactions.sort((a, b) => {
        if (a.lt < b.lt) return -1;
        if (a.lt > b.lt) return 1;
        return 0;
    });
    logger().debug(`found ${newTransactions.length} new transactions for ${address}`);
    return newTransactions;
}


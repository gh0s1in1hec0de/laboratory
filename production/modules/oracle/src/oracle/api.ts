import { currentNetwork, getConfig, mainnetKeys, testnetKeys } from "../config";
import { Address, TonClient, TonClient4, type Transaction } from "@ton/ton";
import type { LamportTime, RawAddressString } from "starton-periphery";
import { delay, maybeBruteforceOverload, Network } from "../utils";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { logger } from "../logger";

class RateLimiter {
    private tokens: number;
    private lastRefill: number;
    private readonly maxTokens: number;
    private readonly refillRate: number;

    constructor(limitPerSecond: number) {
        this.lastRefill = Date.now();

        this.tokens = limitPerSecond;
        this.maxTokens = limitPerSecond;
        this.refillRate = limitPerSecond;
    }

    async waitForToken(): Promise<void> {
        this.refillTokens();
        if (!this.tokens) {
            await delay(1 / this.refillRate);
            return this.waitForToken();
        }
        this.tokens--;
    }

    private refillTokens(): void {
        const now = Date.now();
        const timePassed = now - this.lastRefill;
        const refill = timePassed * (this.refillRate / 1000);
        this.tokens = Math.min(this.maxTokens, this.tokens + refill);
        this.lastRefill = now;
    }
}

export class BalancedTonClient {
    private readonly keys: string[];
    private currentKeyIndex: number;
    private activeLaunchesNumber: number;
    private rateLimiter: RateLimiter;

    constructor(network: Network) {
        this.currentKeyIndex = 0;
        this.activeLaunchesNumber = 0;
        this.keys = network === Network.Testnet ? testnetKeys() : mainnetKeys();
        this.rateLimiter = new RateLimiter(getConfig().oracle.api.limit_per_second);
    }

    async client(): Promise<TonClient> {
        await this.rateLimiter.waitForToken();
        if (this.currentKeyIndex < this.keys.length - 1) this.currentKeyIndex += 1;
        else this.currentKeyIndex = 0;
        const apiKey = this.keys[this.currentKeyIndex];

        logger().debug(` - tonclient apikey for operation: ${apiKey}`);
        return new TonClient({
            endpoint: `https://${currentNetwork() === Network.Testnet ? "testnet." : ""}toncenter.com/api/v2/jsonRPC`,
            apiKey,
            timeout: 20000
        });
    }

    async execute<T>(closure: (client: TonClient) => Promise<T> | T, resend: boolean = false): Promise<T> {
        return resend ? maybeBruteforceOverload(closure(await this.client())) : closure(await this.client());
    }

    incrementActiveLaunchesAmount() {
        this.activeLaunchesNumber += 1;
    }

    decrementActiveLaunchesAmount() {
        this.activeLaunchesNumber -= 1;
    }

    delayValue() {
        // Rewrite
        // Are you ready for dumb code?
        if (this.activeLaunchesNumber < 10) return 10000;
        else return 20000;
    }
}

export const balancedTonClient = new BalancedTonClient(currentNetwork() as Network);
// Try "https://mainnet-v4.tonhubapi.com"
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
    return balancedTonClient.execute(c =>
        c.getTransactions(Address.parse(address), {
            limit,
            lt: from?.lt?.toString(),
            hash: from?.hash,
            to_lt: to_lt?.toString(),
            archival
        }), true
    );
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
            await delay(0.75);
        }

        const transactions = await getTransactionsForAccount(address, stopAt, startFrom, parsingOptions?.archival, parsingOptions?.limit);

        if (transactions.length === 0) break;
        newTransactions.push(...transactions);
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


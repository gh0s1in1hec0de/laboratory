import { Address, TonClient, type Transaction } from "@ton/ton";
import type { LamportTime, RawAddressString } from "../standards";
import { delay, Network } from "../utils";
import type { Logger } from "winston";

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
        this.tokens = Math.min(this.maxTokens, Math.floor(this.tokens + refill));
        this.lastRefill = now;
    }
}

export class BalancedTonClient {
    private readonly keys: string[];
    private currentKeyIndex: number;
    private activeLaunchesNumber: number;
    private rateLimiter: RateLimiter;
    private readonly network: Network;
    private limitPerSecond: number;

    constructor(network: Network, apiKeys: string[], limitPerSecond: number) {
        this.limitPerSecond = limitPerSecond;
        this.rateLimiter = new RateLimiter(limitPerSecond);
        this.activeLaunchesNumber = 0;
        this.currentKeyIndex = 0;
        this.network = network;
        this.keys = apiKeys;
    }

    async client(): Promise<TonClient> {
        await this.rateLimiter.waitForToken();
        if (this.currentKeyIndex < this.keys.length - 1) this.currentKeyIndex += 1;
        else this.currentKeyIndex = 0;
        const apiKey = this.keys[this.currentKeyIndex];
        return new TonClient({
            endpoint: `https://${this.network === Network.Testnet ? "testnet." : ""}toncenter.com/api/v2/jsonRPC`,
            apiKey,
            timeout: 20000
        });
    }

    async execute<T>(closure: (client: TonClient) => Promise<T> | T, _resend: boolean = false): Promise<T> {
        return closure(await this.client());
    }

    incrementActiveLaunchesAmount() {
        this.activeLaunchesNumber += 1;
    }

    decrementActiveLaunchesAmount() {
        this.activeLaunchesNumber -= 1;
    }

    delayValue() {
        // if total amount of requests per second needed > limit per second
        return this.activeLaunchesNumber * 5 > this.limitPerSecond ? 30 : 15;
    }

    // Limited to 100 transactions per request by TonCenter;
    //
    // When lt and hash are set to transaction x, parsing begins from the transaction immediately following `x`, excluding `x` itself.
    getTransactionsForAccount(address: RawAddressString, to_lt?: LamportTime, from?: {
        lt: LamportTime,
        hash: string,
    }, archival = true, limit = 100) {
        return this.execute(c =>
            c.getTransactions(Address.parse(address), {
                limit,
                lt: from?.lt?.toString(),
                hash: from?.hash,
                to_lt: to_lt?.toString(),
                archival
            }), true
        );
    }
}


// `stopAt` is lamport time of last known tx; returns an array of new transactions oldest -> the newest
//
// Warning! Function may throw and error - this case should be properly handled
export async function retrieveAllUnknownTransactions(
    address: RawAddressString,
    stopAt: LamportTime,
    logger: () => Logger,
    client: BalancedTonClient,
    parsingOptions?: {
        archival: boolean,
        limit: number,
    },
): Promise<Transaction[] | null> {
    logger().debug(`[*] ${retrieveAllUnknownTransactions.name}`); // THIS CODE IS A FUCKING JOKE BTW
    logger().debug(` - start txs parsing for account ${address} from ${stopAt}`);
    const newTransactions: Transaction[] = [];
    const limit = parsingOptions?.limit ?? 100;
    let startFrom: { lt: LamportTime, hash: string } | undefined = undefined;

    let iterationIndex = 1;
    while (true) {
        if (iterationIndex > 1) {
            logger().warn(` - exceeded update limit(${limit} per request) for address ${address}`);
            await delay(1);
        }

        const transactions = await client.getTransactionsForAccount(address, stopAt, startFrom, parsingOptions?.archival, parsingOptions?.limit);

        if (transactions.length === 0) break;
        newTransactions.push(...transactions);
        if (transactions.length < limit) break;

        // Update our new starting point to last parsed tx
        const lastParsedTx = transactions[transactions.length - 1];
        startFrom = { lt: lastParsedTx.lt, hash: lastParsedTx.hash().toString("base64") };
        iterationIndex += 1;
    }
    // No updates happened case
    if (!newTransactions.length) {
        logger().debug(` - no updates for ${address}`);
        return null;
    }
    // From oldest to newest
    newTransactions.sort((a, b) => {
        if (a.lt < b.lt) return -1;
        if (a.lt > b.lt) return 1;
        return 0;
    });
    logger().info(`found ${newTransactions.length} new transactions for ${address}`);
    return newTransactions;
}
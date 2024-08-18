import { Address, TonClient, TonClient4, type Transaction, type TupleItem } from "@ton/ton";
import { type LamportTime, maybeBruteforceOverload, Network } from "../utils";
import { currentNetwork, mainnetKeys, testnetKeys } from "../config";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";

// RR bitch (RoundRobin, not Rolls-Royce)
class BalancedTonClient {
    private readonly keys: string[];
    private currentKeyIndex: number;

    constructor(network: Network) {
        this.currentKeyIndex = 0;
        this.keys = network == Network.Testnet ? testnetKeys() : mainnetKeys();
    }

    get() {
        if (this.currentKeyIndex < this.keys.length - 1) this.currentKeyIndex += 1;
        else this.currentKeyIndex = 0;
        const apiKey = this.keys[this.currentKeyIndex];
        console.debug(`current apikey: ${apiKey}`);
        return new TonClient({
            endpoint: `https://${currentNetwork() === "testnet" ? "testnet." : ""}toncenter.com/api/v2/jsonRPC`,
            apiKey
        });
    }
}

const balancedTonClient = new BalancedTonClient(currentNetwork() as Network);
const tonClient4 = new TonClient4({ endpoint: await getHttpV4Endpoint({ network: currentNetwork() as Network }) });

// Works with TonClient4 under the hood, includes last account's `lamport_time`
export async function getAccount(address: Address, seqno?: number) {
    const seqno_ = seqno ? seqno : (await tonClient4.getLastBlock()).last.seqno;
    console.debug(`Seqno has been ${seqno ? "provided manually" : "taken from api"}: ${seqno_}`);
    // Do we really need it here?
    return maybeBruteforceOverload<any>(tonClient4.getAccount(seqno_, address));
}

// Limited to 100 transactions per request by TonCenter;
//
// When lt and hash are set to transaction x, parsing begins from the transaction immediately following `x`, excluding `x` itself.
export async function getTransactionsForAccount(address: Address, to_lt?: LamportTime, from?: {
    lt: LamportTime;
    hash: string;
}, archival = true, limit = 100) {
    return await maybeBruteforceOverload<Transaction[]>(
        balancedTonClient.get().getTransactions(address, {
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


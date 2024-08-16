import {getHttpV4Endpoint} from '@orbs-network/ton-access';
import {Address, TonClient, TonClient4, type Transaction} from "@ton/ton";
import {maybeBruteforceOverload, Network} from "../utils.ts";

// Ton Client Api 588cb5d0c59bdcee3f1f7810ff13284b7d89aa481481c02843587c6b43e07e82
export class TonEye {
    private tonClient: TonClient;
    private tonClient4: TonClient4;

    private constructor(tonClient: TonClient, tonClient4: TonClient4) {
        this.tonClient = tonClient;
        this.tonClient4 = tonClient4;
    }

    // Static async factory method
    public static async raise(network: Network, apiKey: string): Promise<TonEye> {
        const endpoint = `https://${network === Network.Testnet ? `testnet.` : ``}toncenter.com/api/v2/jsonRPC`;
        const tonClient = new TonClient({endpoint, apiKey});
        const tonClient4 = new TonClient4({endpoint: await getHttpV4Endpoint({network})});
        return new TonEye(tonClient, tonClient4);
    }

    // Works with TonClient4 under the hood, includes last account's `lamport_time`
    public async getAccount(address: Address, seqno?: number) {
        const seqno_ = seqno ? seqno : (await this.tonClient4.getLastBlock()).last.seqno;
        console.debug(`Seqno has been ${seqno ? `provided manually` : `taken from api`}: ${seqno_}`);
        // Do we really need it here?
        return maybeBruteforceOverload<any>(this.tonClient4.getAccount(seqno_, address));
    }

    // Limited to 100 transactions per request;
    //
    // When lt and hash are set to transaction x, parsing begins from the transaction immediately following `x`, excluding `x` itself.
    public async getTransactionsForAccount(address: Address, lt?: string, hash?: string, to_lt?: string, archival: boolean = true, limit: number = 100) {
        return await maybeBruteforceOverload<Transaction[]>(this.tonClient.getTransactions(address, {limit, lt, hash, to_lt, archival}));
    }
}

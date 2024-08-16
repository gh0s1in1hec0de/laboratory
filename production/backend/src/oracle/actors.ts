import {getHttpV4Endpoint} from '@orbs-network/ton-access';
import {Address, TonClient, TonClient4} from "@ton/ton";
import {Network} from "../utils.ts";

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
        const endpoint = `https://${network === Network.Testnet ? `testnet.` : ``}toncenter.com/api/v2/jsonRPC`
        const tonClient = new TonClient({endpoint, apiKey});
        const tonClient4 = new TonClient4({
            endpoint: await getHttpV4Endpoint({network}),
        });
        return new TonEye(tonClient, tonClient4);
    }

    // Works with TonClient4 under the hood, includes last account's `lamport_time`
    public async getAccount(address: Address, seqno?: number) {
        const seqno_ = seqno ? seqno : (await this.tonClient4.getLastBlock()).last.seqno;
        console.debug(`Seqno has been ${seqno ? `provided manually` : `taken from api`}: ${seqno_}`);
        return this.tonClient4.getAccount(seqno_, address);
    }

    // Limited to 100 transactions per request
    public async getTransactionsForAccount(address: Address, opts: {
        limit: number, lt: string, hash: string, archival?: boolean, to_lt?: string
    }) {
        return await this.tonClient.getTransactions(address, opts);
    }
}

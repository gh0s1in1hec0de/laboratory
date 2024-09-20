import { type CompositeHighloadQueryId, HighloadQueryIdManager, type RawAddressString } from "starton-periphery";
import * as db from "../../db";

export class CachedHighloadQueryIdManager extends HighloadQueryIdManager {
    private readonly cacheAddress: RawAddressString;

    constructor(cacheAddress: RawAddressString, shift: bigint = 0n, bitnumber: bigint = 0n) {
        super(shift, bitnumber);
        this.cacheAddress = cacheAddress;
    }

    async getNextCached(): Promise<CompositeHighloadQueryId> {
        const next = super.getNext();
        const equalSeqno = HighloadQueryIdManager.calculateQueryId(next.shift, next.bitnumber);
        const parametrized = `${this.cacheAddress}:query_id`;
        await db.setHeightForAddress(parametrized, equalSeqno);
        return next;
    }

    static async fromAddress(address: RawAddressString): Promise<CachedHighloadQueryIdManager> {
        const maybeQueryId = await db.getHeight(`${address}:query_id`);
        if (maybeQueryId) {
            const { shift, bitnumber } = HighloadQueryIdManager.calculateComponents(maybeQueryId);
            return new CachedHighloadQueryIdManager(address, shift, bitnumber);
        } else return new CachedHighloadQueryIdManager(address);
    }
}
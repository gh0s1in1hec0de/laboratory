import { BIT_NUMBER_SIZE, MAX_BIT_NUMBER, maxShift } from "./const";
import { ok as assert } from "node:assert";

export type CompositeHighloadQueryId = {
    shift: bigint,
    bitnumber: bigint
}

export class HighloadQueryIdManager {
    private shift: bigint;
    private bitnumber: bigint;

    constructor(shift: bigint = 0n, bitnumber: bigint = 0n) {
        this.shift = shift;
        this.bitnumber = bitnumber;
    }

    static fromShiftAndBitNumber(shift: bigint, bitnumber: bigint): HighloadQueryIdManager {
        assert(shift >= 0n && shift <= BigInt(maxShift), "invalid shift");
        assert(bitnumber >= 0n && bitnumber <= MAX_BIT_NUMBER, "invalid bitnumber");
        return new HighloadQueryIdManager(shift, bitnumber);
    }

    getNext(): CompositeHighloadQueryId {
        this.bitnumber += 1n;
    
        assert(!(this.shift === BigInt(maxShift) && this.bitnumber > (MAX_BIT_NUMBER - 1n)), "wallet overload");
    
        if (this.bitnumber > MAX_BIT_NUMBER) {
            this.bitnumber = 0n;
            this.shift += 1n;
            
            if (this.shift > BigInt(maxShift))  this.shift = 0n; 
        }
    
        return { shift: this.shift, bitnumber: this.bitnumber };
    }

    hasNext(): boolean {
        return !(this.bitnumber >= (MAX_BIT_NUMBER - 1n) && this.shift === BigInt(maxShift));
    }

    getShift(): bigint {
        return this.shift;
    }

    getBitNumber(): bigint {
        return this.bitnumber;
    }

    getQueryId(): bigint {
        return (this.shift << BIT_NUMBER_SIZE) + this.bitnumber;
    }

    static calculateQueryId(shift: bigint, bitnumber: bigint): bigint {
        return (shift << BIT_NUMBER_SIZE) + bitnumber;
    }

    static calculateComponents(queryId: bigint): CompositeHighloadQueryId {
        const shift = queryId >> BIT_NUMBER_SIZE;
        const bitnumber = queryId & 1023n;
        return { shift, bitnumber };
    }

    static fromQueryId(queryId: bigint): HighloadQueryIdManager {
        const shift = queryId >> BIT_NUMBER_SIZE;
        const bitnumber = queryId & 1023n;
        return this.fromShiftAndBitNumber(shift, bitnumber);
    }

    static fromSeqno(seqno: bigint): HighloadQueryIdManager {
        const shift = seqno / 1023n;
        const bitnumber = seqno % 1023n;
        return this.fromShiftAndBitNumber(shift, bitnumber);
    }

    toSeqno(shift: bigint, bitnumber: bigint): bigint {
        return bitnumber + shift * 1023n;
    }
}

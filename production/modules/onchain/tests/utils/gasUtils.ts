import { Address, Cell, Transaction, beginCell, fromNano, storeMessage, toNano, } from "@ton/core";
import { internal } from "@ton/sandbox";
import {
    computeFwdFeesVerbose,
    collectCellStats,
    computedGeneric,
    computeFwdFees,
    StorageStats,
    MsgPrices,
    FullFees
} from "./gas";

// Measures fees for code execution (computational fee) and returns nanotons value
export function printTxGasStats(name: string, transaction: Transaction): bigint {
    const txComputed = computedGeneric(transaction);
    console.log(`${name} used ${txComputed.gasUsed} gas`);
    console.log(`${name} gas cost is ${txComputed.gasFees} (${fromNano(txComputed.gasFees)} TONs)`);
    return txComputed.gasFees;
}

// `force_ref` is set to `true` for bony-in-a-ref cases
export function estimateBodyFwdFee(body: Cell, forceRef: boolean, prices: MsgPrices): FullFees {
    const mockAddr = new Address(0, Buffer.alloc(32, "A"));
    const testMsg = internal({
        from: mockAddr,
        to: mockAddr,
        value: toNano("1"),
        body
    });
    const packed = beginCell().store(storeMessage(testMsg, { forceRef })).endCell();
    const stats = collectCellStats(packed, [], true);
    return computeFwdFeesVerbose(prices, stats.cells, stats.bits);
}

// Returns total fee (performing reverse-check before)
export function estimateBodyFwdFeeWithReverseCheck(body: Cell, forceRef: boolean, prices: MsgPrices): bigint {
    const feesRes = estimateBodyFwdFee(body, forceRef, prices);
    const reverse = (feesRes.remaining * 65536n) / (65536n - prices.firstFrac);
    expect(reverse).toBeGreaterThanOrEqual(feesRes.total);
    return reverse;
}

export function forwardStateInitOverhead(prices: MsgPrices, stats: StorageStats): bigint {
    return computeFwdFees(prices, stats.cells, stats.bits) - prices.lumpPrice;
}
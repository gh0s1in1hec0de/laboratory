import { Address, toNano, Slice, beginCell } from "@ton/core";
import { BlockchainTransaction } from "@ton/sandbox";

export const BASECHAIN = 0;
export const randomAddress = (wc: number = BASECHAIN) => {
    const buf = Buffer.alloc(32);
    for (let i = 0; i < buf.length; i++) {
        buf[i] = Math.floor(Math.random() * 256);
    }
    return new Address(wc, buf);
};

// Good old days
// export const noneAddress = (isSlice: boolean = false, wc: number = BASECHAIN) => {
//     if (isSlice) return beginCell().storeUint(0, 2).endCell().beginParse();
//     else return new Address(wc, Buffer.alloc(32, 0));
// };

export const differentAddress = (old: Address) => {
    let newAddr: Address;
    do {
        newAddr = randomAddress(old.workChain);
    } while (newAddr.equals(old));

    return newAddr;
};

const getRandom = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
};

export const getRandomInt = (min: number, max: number) => {
    return Math.round(getRandom(min, max));
};

export const getRandomTon = (min: number, max: number): bigint => {
    return toNano(getRandom(min, max).toFixed(9));
};

export const printTxsLogs = (txs: BlockchainTransaction[], title?: string) => {
    let txIndex = 1;
    if (title) console.info(`[*] ${title}`);
    for (const tx of txs) {
        console.info(` - transaction #${txIndex}`);
        console.log(tx.vmLogs);
        txIndex += 1;
    }

};
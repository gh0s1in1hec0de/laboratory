export const SUBWALLET_ID = 0x10ad; // 4269
export const DEFAULT_TIMEOUT = 128;

export enum OP {
    InternalTransfer = 0xae42e5a4
}

export enum Errors {
    invalidSignature = 33,
    invalidSubwallet = 34,
    invalidCreation_time = 35,
    alreadyExecuted = 36,
}

export const BIT_NUMBER_SIZE = 10n; // 10 bits
export const SHIFT_SIZE = 13n; // 13 bits

export const maxKeyCount = (1 << Number(SHIFT_SIZE)); // Max key count, not max key value
export const maxShift = maxKeyCount - 1; // Max shift based on key count
export const MAX_BIT_NUMBER = (1n << BIT_NUMBER_SIZE) - 1n; // Max bit number [0 .. 1022]
export const maxQueryCount = maxKeyCount * Number(MAX_BIT_NUMBER + 1n); // Total possible queries
export const maxQueryId = (BigInt(maxShift) << BIT_NUMBER_SIZE) + MAX_BIT_NUMBER; // Max possible query ID

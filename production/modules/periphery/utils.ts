import { beginCell, fromNano, type Slice, toNano } from "@ton/core";
import { OnchainMetadataStandard } from "./standards";
import { DeprecatedTokenLaunchStorage } from "./D";
import { TokenLaunchTimings } from "./types";
import { TokenLaunchStorageV1 } from "./V1";
import { ok as assert } from "assert";

export type UnixTimeSeconds = number;

export function parseTokenLaunchTimings(tokenLaunchStorage: DeprecatedTokenLaunchStorage | TokenLaunchStorageV1, pollingDuration: number = 6 * 86400): TokenLaunchTimings {
    return {
        startTime: tokenLaunchStorage.saleState.general.startTime,
        creatorRoundEndTime: tokenLaunchStorage.saleState.creatorRound.endTime,
        wlRoundEndTime: tokenLaunchStorage.saleState.wlRound.endTime,
        publicRoundEndTime: tokenLaunchStorage.saleState.pubRound.endTime,
        endTime: tokenLaunchStorage.saleState.pubRound.endTime + pollingDuration,
    };
}

export function tokenMetadataToCell(content: OnchainMetadataStandard) {
    return beginCell()
        .storeStringRefTail(content.uri) // Snake logic under the hood
        .endCell();
}

export function endParse(slice: Slice) {
    if (slice.remainingBits > 0 || slice.remainingRefs > 0) {
        throw new Error("remaining bits in data");
    }
}

export function jettonToNano(amount: number | bigint | string, decimals: number = 6) {
    const nineDecimalsRes = toNano(amount);
    if (decimals > 9) return nineDecimalsRes * 10n ** BigInt(decimals - 9);
    if (decimals < 9) return nineDecimalsRes / 10n ** BigInt(9 - decimals);
    return nineDecimalsRes;
}

export function jettonFromNano(amount: number | bigint | string, decimals: number = 6) {
    assert(decimals <= 9, "not supported yet");
    return fromNano(decimals < 9 ? BigInt(amount) * (10n ** BigInt(9 - decimals)) : amount);
}

// Just for clarity
export function toPct(percents: number) {
    assert(percents >= 0 && percents <= 100, "you dumbass");
    return percents * 1000;
}

export function getQueryId() {
    const currentTimeMs = Date.now();
    const secs = Math.floor(currentTimeMs / 1000);
    const ms = currentTimeMs % 1000;

    const remainder = secs % 17;
    const closestDivisible = remainder ? secs - remainder : secs;

    return closestDivisible * 1000 + ms;
}

export function delay(sec: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

export enum Network {
    Mainnet = "mainnet",
    Testnet = "testnet"
}

export enum AppMode {
    DEV = "dev",
    PROD = "prod"
}

// Server requests
export enum SortingOrder {
    LOW_TO_HIGH = "ASC",
    HIGH_TO_LOW = "DESC"
}

export enum LaunchSortParameters {
    CREATED_AT = "created_at",
    TOTAL_TONS_COLLECTED = "total_tons_collected",
}

export class CommonServerError extends Error {
    public code: number;
    public message: string;

    constructor(code: number, message: string) {
        super(message);
        this.code = code;
        this.message = message;
        this.name = "CommonServerError";
    }
}

export function toSnakeCase(camelCaseStr: string) {
    return camelCaseStr.replace(/([A-Z])/g, "_$1").toLowerCase();
}

export enum Locales {
    RU = "ru",
    EN = "en"
}

// Should be used for parsing localed tasks in database
export function parseLocaledText(input: string): Map<string, string> {
    const result = new Map<string, string>();

    // Split the input by '%', which separates locales
    const parts = input.split('%').map(part => part.trim());

    for (const part of parts) {
        // Match locale and text using `::`, allowing for spaces around them
        const match = part.match(/^\s*(\w{2})\s*::\s*(.+)\s*$/);
        if (!match) {
            throw new Error(`Invalid localized text format: ${part}`);
        }

        const [, locale, text] = match;
        if (!Object.values(Locales).includes(locale as Locales)) {
            throw new Error(`Invalid locale '${locale}' in localized text`);
        }

        result.set(locale, text.trim());
    }

    return result;
}
// When locale is chosen - use it to parse subtasks from description
export type Subtask = { name: string, description: string };
export function parseSubtasks(description: string): Subtask[] {
    const subtasks = description.split("&");
    const result = [];
    for (let i = 0; i < subtasks.length; i += 2) {
        result.push({
            name: subtasks[i],
            description: subtasks[i + 1] || "",
        });
    }
    return result;
}


import { parseGetConfigResponse, parseMoneyFlows, } from "../chainMessageParsers";
import { GetConfigResponse, MoneyFlows, TokenLaunchTimings } from "../types";
import { jettonFromNano, UnixTimeSeconds } from "../utils";
import { Address, ContractProvider, fromNano, toNano } from "@ton/core";
import { Coins, GlobalVersions } from "../standards";
import { TonClient4 } from "@ton/ton";
import {
    getCreatorAmountOut,
    getPublicAmountOut,
    CreatorPriceConfig,
    SyntheticReserves, getAmountOutMock,
} from "./priceOracle";

export enum SalePhase {
    NOT_STARTED = "NOT_STARTED",
    CREATOR = "CREATOR",
    WHITELIST = "WHITELIST",
    PUBLIC = "PUBLIC",
    ENDED = "ENDED",
}

export type UserShare = {
    whitelistTons: Coins,
    publicJettons: Coins,
    isCreator: boolean
}

export function getCurrentSalePhase(
    timings: TokenLaunchTimings,
    currentTime: UnixTimeSeconds = Math.floor(Date.now() / 1000),
): { phase: SalePhase; nextPhaseIn: UnixTimeSeconds | null } {
    const {
        startTime,
        creatorRoundEndTime,
        wlRoundEndTime,
        publicRoundEndTime,
        endTime,
    } = timings;

    if (currentTime < startTime)
        return {
            phase: SalePhase.NOT_STARTED,
            nextPhaseIn: startTime - currentTime,
        };

    if (currentTime < creatorRoundEndTime)
        return {
            phase: SalePhase.CREATOR,
            nextPhaseIn: creatorRoundEndTime - currentTime,
        };

    if (currentTime < wlRoundEndTime)
        return {
            phase: SalePhase.WHITELIST,
            nextPhaseIn: wlRoundEndTime - currentTime,
        };

    if (currentTime < publicRoundEndTime)
        return {
            phase: SalePhase.PUBLIC,
            nextPhaseIn: publicRoundEndTime - currentTime,
        };

    if (currentTime < endTime)
        return { phase: SalePhase.ENDED, nextPhaseIn: endTime - currentTime };

    return { phase: SalePhase.ENDED, nextPhaseIn: null };
}

/**
 * Returns an estimated nano-jetton value a participant will receive for their investment.
 *
 * ## Instructions:
 *
 * ### How to calculate creator's boundaries:
 * 1. Call `getAmountOut` with `value = 10 TON`. This will return the amount of nano jettons for this value.
 * 2. Calculate the amount of nano tons per one nano jetton:
 *    ```
 *    toNano(10) / receivedNanoJettons
 *    ```
 * 3. Perform the calculation:
 *    ```
 *    (totalSupply * 25 / 100) * value from step 2
 *    ```
 *    - **Note**: To avoid zeroing the result (since we are working with bigints), perform the following:
 *      ```
 *      (totalSupply * 25 / 100) * toNano(10) / receivedNanoJettons
 *      ```
 *      This ensures that the value from the first two operations is greater than the divisor.
 *
 * @param version - The version of the global configuration (e.g., `V1`, `V2`).
 * @param phase - The sale phase (`SalePhase.CREATOR`, `SalePhase.WHITELIST`, or `SalePhase.PUBLIC`).
 * @param data - The data structure containing phase-specific parameters (`WlPhaseLimits` or `SyntheticReserves`).
 * @param value - The input value in TONs for which to calculate the estimated amount (default: `toNano("10")`).
 * @param withReferral - !!invited_by of caller.
 * @returns The estimated amount of coins a participant will receive.
 * @throws Will throw an error if the phase or data does not match any expected combination.
 */
// SyntheticReserves - public
// WlPhaseLimits - whitelist
export function getAmountOut(
    version: GlobalVersions,
    phase: SalePhase.CREATOR | SalePhase.PUBLIC,
    data: CreatorPriceConfig | SyntheticReserves,
    value: Coins = toNano("10"),
    withReferral: boolean = false,
): Coins {
    if (phase === SalePhase.CREATOR && (data as CreatorPriceConfig).wlRoundFutJetLimit !== undefined)
        return getCreatorAmountOut(version, value, data as CreatorPriceConfig);

    // Just getting pure value for price
    if (phase === SalePhase.PUBLIC && (data as SyntheticReserves).syntheticTonReserve !== undefined)
        return getAmountOutMock(value, (data as SyntheticReserves).syntheticTonReserve, (data as SyntheticReserves).syntheticJetReserve);

    console.log(`Input: `);
    console.log(`Phase: ${phase}`);
    console.log(data);
    throw new Error("meowreachable");
}

// tons - toNano(10)
// jettons - getAmountOut()
export function calculatePrice(
    jettons: Coins,
    tons: Coins = toNano("10"),
): number {
    return Number(fromNano(tons)) / Number(jettonFromNano(jettons));
}

/*
On frontend, you can get TonClient4 like that:

import { getHttpV4Endpoint } from "@orbs-network/ton-access";

const tonClient = new TonClient4({
    endpoint: await getHttpV4Endpoint({ network: "mainnet (or "testnet")" }),
});
*/

async function getSeqno(tonClient: TonClient4) {
    return (await tonClient.getLastBlock()).last.seqno;
}

async function getMoneyFlows(
    tonClient: TonClient4,
    contractAddress: Address,
    seqno?: number,
): Promise<MoneyFlows> {
    let { reader } = await tonClient.runMethod(
        seqno ?? (await getSeqno(tonClient)),
        contractAddress,
        "get_money_flows",
        [],
    );
    return parseMoneyFlows(reader);
}

async function getConfig(
    tonClient: TonClient4,
    contractAddress: Address,
    seqno?: number,
): Promise<GetConfigResponse> {
    let { reader } = await tonClient.runMethod(
        seqno ?? (await getSeqno(tonClient)),
        contractAddress,
        "get_config",
        [],
    );
    return parseGetConfigResponse(reader);
}

export async function getApproximateClaimAmountOnchain(
    tonClient: TonClient4,
    contractAddress: Address,
    { whitelistTons, publicJettons, isCreator }: UserShare,
    seqno ? : number,
): Promise < Coins > {
    let { reader } = await tonClient.runMethod(
        seqno ?? (await getSeqno(tonClient)),
        contractAddress,
        "get_approximate_claim_amount",
        [
            { "type": "int", "value": whitelistTons },
            { "type": "int", "value": publicJettons },
            { "type": "int", "value": isCreator ? -1n : 0n }
        ],
    );
    return reader.readBigNumber();
};

// mode: WHITELIST(STAR CLUB) - "Config" | PUBLIC - "MoneyFlows"
export async function getContractData(
    mode: "Config" | "MoneyFlows" | "All",
    tonClient: TonClient4,
    tokenLaunchAddress: Address,
    seqno?: number,
): Promise<GetConfigResponse | MoneyFlows | (GetConfigResponse & MoneyFlows)> {
    const seqno_ = seqno ?? (await getSeqno(tonClient));
    switch (mode) {
        case "Config":
            return await getConfig(tonClient, tokenLaunchAddress, seqno_);
        case "MoneyFlows":
            return await getMoneyFlows(tonClient, tokenLaunchAddress, seqno_);
        case "All":
            const [config, moneyFlows] = await Promise.all([
                getConfig(tonClient, tokenLaunchAddress, seqno_),
                getMoneyFlows(tonClient, tokenLaunchAddress, seqno_),
            ]);
            return {
                ...config,
                ...moneyFlows,
            };
    }
}

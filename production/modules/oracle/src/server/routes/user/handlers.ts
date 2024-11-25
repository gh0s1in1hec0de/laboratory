import { CommonServerError } from "starton-periphery";
import * as db from "../../../db";
import type {
    ConnectCallerWalletRequest,
    GetUserBalancesResponse,
    GetUserBalancesRequest,
    MappedUserBalances,
    Caller
} from "starton-periphery";

export async function connectCallerWallet(
    { address, }: ConnectCallerWalletRequest
): Promise<Caller> {
    const res = await db.connectWallet(address);
    if (!res) throw new CommonServerError(400, "User already exists");
    return res;
}

export async function getUserBalances(
    { user, launch }: GetUserBalancesRequest
): Promise<GetUserBalancesResponse> {
    const userBalances = await db.getCallerBalances(user, launch);

    return userBalances ? userBalances.reduce(
        (acc, balance) => {
            const { tokenLaunch } = balance;
            acc[tokenLaunch] = balance;
            return acc;
        }, {} as MappedUserBalances
    ) : null;
}
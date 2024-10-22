import * as db from "../../../db";
import {
    type ConnectedWalletRequest,
    type UserBalancesRequest,
    type ExtendedUserBalance,
    CommonServerError,
    type Caller,
} from "starton-periphery";

export async function connectCallerWallet({
    address,
}: ConnectedWalletRequest): Promise<Caller | string> {
    const res = await db.connectWallet(address);
    if (!res) throw new CommonServerError(400, "User already exists");
    return res;
}

export async function getUserBalances({ user, launch }: UserBalancesRequest): Promise<ExtendedUserBalance[] | null> {
    return await db.getCallerBalances(user, launch);
}
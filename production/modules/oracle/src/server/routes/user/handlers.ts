import { CommonServerError, } from "starton-periphery";
import * as db from "../../../db";
import type {
    GetUserBalancesResponse,
    ConnectCallerWalletRequest,
    GetUserBalancesRequest,
    Caller,
} from "starton-periphery";

export async function connectCallerWallet({
    address,
}: ConnectCallerWalletRequest): Promise<Caller | string> {
    const res = await db.connectWallet(address);
    if (!res) throw new CommonServerError(400, "User already exists");
    return res;
}

export async function getUserBalances({ user, launch }: GetUserBalancesRequest): Promise<GetUserBalancesResponse> {
    return await db.getCallerBalances(user, launch);
}
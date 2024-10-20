import { type Caller, CommonServerError, type ConnectedWalletRequest } from "starton-periphery";
import * as db from "../../../db";

export async function connectCallerWallet({
    address,
}: ConnectedWalletRequest): Promise<Caller | string> {
    const res = await db.connectWallet(address);
    if (!res) throw new CommonServerError(400, "User already exists") ;
    return res;
}
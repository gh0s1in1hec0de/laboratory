import type { Caller } from "starton-periphery";
import { logger } from "../../../logger";
import * as db from "../../../db";

export async function connectCallerWallet({
    address,
}: db.ConnectedWalletRequest): Promise<Caller | string> {
    try {
        const res = await db.connectWallet(address);
        if (!res) return "user already exists";
        return res;
    } catch (e) {
        logger().error(`error in http request 'connectWallet': ${e}`);
        return `error: ${e}`;
    }
}
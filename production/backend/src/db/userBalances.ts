import type{ StoredUserBalance, SqlClient } from "./types";
import type { RawAddressString } from "starton-periphery";
import { globalClient } from "./db";

export async function getUserBalance(address: RawAddressString, launch: RawAddressString, client?: SqlClient): Promise<StoredUserBalance | null> {
    const res = await (client || globalClient)<StoredUserBalance[]>`
        SELECT *
        FROM user_balances
        WHERE "user" = ${address}
          AND token_launch = ${launch};
    `;
    return res.length ? res[0] : null;
}

export async function getAllUserBalances(address: RawAddressString, client?: SqlClient): Promise<StoredUserBalance[] | null> {
    const res = await (client || globalClient)<StoredUserBalance[]>`
        SELECT *
        FROM user_balances
        WHERE "user" = ${address};
    `;
    return res.length ? res : null;
}
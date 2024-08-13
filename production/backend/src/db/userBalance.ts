import type {Address, StoredUserBalance, Client} from "./types.ts";
import {ok as assert} from "node:assert";
import {globalClient} from "./db.ts";

export async function getUserBalance(address: Address, launch: Address, client?: Client): Promise<StoredUserBalance> {
    const res = await (client || globalClient)<StoredUserBalance[]>`
        SELECT *
        FROM user_balances
        WHERE "user" = ${address}
          AND token_launch = ${launch}
    `;
    assert(res.length === 1, `exactly 1 column must be returned, got: ${res}`);
    return res[0];
}

export async function getAllUserBalances(address: Address, client?: Client): Promise<StoredUserBalance[]> {
    const res = await (client || globalClient)<StoredUserBalance[]>`
        SELECT *
        FROM user_balances
        WHERE "user" = ${address}
    `;
    assert(res.length > 0, `no balances for user`);
    return res;
}
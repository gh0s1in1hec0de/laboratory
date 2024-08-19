import type { UserActionType, SqlClient, UserAction } from "./types";
import type { Coins, RawAddressString } from "../utils";
import { ok as assert } from "assert";
import { globalClient } from "./db";

export async function storeUserAction(
    type: UserActionType,
    actor: RawAddressString,
    tokenLaunch: RawAddressString,
    whitelistTons: Coins,
    publicTons: Coins,
    jettons: Coins,
    timestamp: Date,
    queryId: bigint,
    client?: SqlClient
): Promise<void> {
    const res = await (client || globalClient)`
        INSERT INTO user_actions (actor, token_launch, action_type, whitelist_tons, public_tons, jettons, timestamp, query_id)
        VALUES (${actor}, ${tokenLaunch}, ${type}, ${whitelistTons}, ${publicTons}, ${jettons}, ${timestamp}, ${queryId})
        RETURNING 1;
    `;
    assert(res.length === 1, `exactly 1 column must be created, got: ${res}`);
}

// Returns `null` to show that nothing was found the explicit way
export async function getUserActions(
    actor: RawAddressString,
    type?: UserActionType,
    tokenLaunch?: RawAddressString,
    after?: Date,
    client?: SqlClient
): Promise<UserAction[] | null> {
    const c = client || globalClient;
    const res = await c<UserAction[]>`
        SELECT *
        FROM user_actions
        WHERE actor = ${actor} ${type ? c`AND type = ${type}` : c``} ${tokenLaunch ? c`AND token_launch = ${tokenLaunch}` : c``} ${after ? c`AND timestamp > ${after}` : c``};
    `;
    return res.length ? res : null;
}
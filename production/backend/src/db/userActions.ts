import type { UserActionType, Client, StoredAddress, UserAction } from "./types.ts";
import type { Coins } from "../utils.ts";
import { globalClient } from "./db.ts";
import { ok as assert } from "assert";

export async function storeUserAction(
    type: UserActionType,
    actor: StoredAddress,
    tokenLaunch: StoredAddress,
    whitelistTons: Coins,
    publicTons: Coins,
    jettons: Coins,
    timestamp: Date,
    client?: Client
): Promise<void> {
    const res = await (client || globalClient)`
        INSERT INTO user_actions (actor, token_launch, action_type, whitelist_tons, public_tons, jettons, timestamp)
        VALUES (${actor}, ${tokenLaunch}, ${type}, ${whitelistTons}, ${publicTons}, ${jettons}, ${timestamp})
        RETURNING 1;
    `;
    assert(res.length === 1, `exactly 1 column must be created, got: ${res}`);
}

// Returns `null` to show that nothing was found the explicit way
export async function getUserActions(
    actor: StoredAddress,
    type?: UserActionType,
    tokenLaunch?: StoredAddress,
    after?: Date,
    client?: Client
): Promise<UserAction[] | null> {
    const c = client || globalClient;
    const res = await c<UserAction[]>`
        SELECT *
        FROM user_actions
        WHERE actor = ${actor} ${type ? c`AND type = ${type}` : c``} ${tokenLaunch ? c`AND token_launch = ${tokenLaunch}` : c``} ${after ? c`AND timestamp > ${after}` : c``};
    `;
    return res.length > 0 ? res : null;
}
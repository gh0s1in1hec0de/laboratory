import type {StoredUserBalance, UserActionType, Client, Address, UserAction} from "./types.ts";
import {globalClient} from "./db.ts";
import {ok as assert} from "assert";
import type {Coins} from "../utils.ts";

export async function storeUserAction(
    type: UserActionType,
    actor: Address,
    tokenLaunch: Address,
    whitelistTons: Coins,
    publicTons: Coins,
    jettons: Coins,
    timestamp: Date,
    client?: Client
): Promise<void> {
    const res = await (client || globalClient)`
        INSERT INTO user_actions (actor, token_launch, action_type, whitelist_tons, public_tons, jettons, timestamp)
        VALUES (${actor}, ${tokenLaunch}, ${type}, ${whitelistTons}, ${publicTons}, ${jettons}, ${timestamp})
        RETURNING 1
    `;
    assert(res.length === 1, `exactly 1 column must be created, got: ${res}`);
}

export async function getUserActions(
    actor: Address,
    type?: UserActionType,
    tokenLaunch?: Address,
    after?: Date,
    client?: Client
): Promise<UserAction[]> {
    const c = client || globalClient;
    return c<UserAction[]>`
        SELECT *
        FROM user_actions
        WHERE actor = ${actor} ${type ? c`AND type = ${type}` : c``} ${tokenLaunch ? c`AND token_launch = ${tokenLaunch}` : c``} ${after ? c`AND timestamp > ${after.getTime() / 1000}` : c``}
    `;
}
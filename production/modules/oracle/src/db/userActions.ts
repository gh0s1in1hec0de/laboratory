import type { SqlClient } from "./types";
import { globalClient } from "./db";
import { logger } from "../logger";
import {
    type RawAddressString,
    type UnixTimeSeconds,
    type UserAction,
    type UserClaim,
    UserActionType,
} from "starton-periphery";

export async function storeUserAction(
    {
        actor,
        tokenLaunch,
        actionType,
        whitelistTons,
        publicTons,
        jettons,
        lt,
        timestamp,
        queryId
    }: UserAction,
    client?: SqlClient
): Promise<void> {
    const res = await (client ?? globalClient)`
        INSERT INTO user_actions
        (actor, token_launch, action_type, whitelist_tons, public_tons, jettons, lt, timestamp, query_id)
        VALUES (${actor}, ${tokenLaunch}, ${actionType}, ${whitelistTons}, ${publicTons}, ${jettons}, ${lt},
                ${timestamp},
                ${queryId})
        ON CONFLICT DO NOTHING
        RETURNING 1;
    `;
    if (res.length === 0) logger().error(`looks like action for ${actor}[${new Date(timestamp)}] already exists`);
}

// Returns `null` to show that nothing was found the explicit way
export async function getCallerActions(
    actor: RawAddressString,
    type?: UserActionType,
    tokenLaunch?: RawAddressString,
    after?: UnixTimeSeconds,
    client?: SqlClient
): Promise<UserAction[] | null> {
    const c = client ?? globalClient;
    const res = await c<UserAction[]>`
        SELECT *
        FROM user_actions
        WHERE actor = ${actor}
            ${type ? c`AND type = ${type}` : c``}
            ${tokenLaunch ? c`AND token_launch = ${tokenLaunch}` : c``}
            ${after ? c`AND timestamp > ${after}` : c``};
    `;
    return res.length ? res : null;
}

export async function storeUserClaim(
    {
        tokenLaunch,
        actor,
        jettonAmount
    }: UserClaim,
    client?: SqlClient
): Promise<void> {
    const res = await (client ?? globalClient)`
        INSERT INTO user_claims
            (token_launch, actor, jetton_amount)
        VALUES (${tokenLaunch}, ${actor}, ${jettonAmount})
        ON CONFLICT DO NOTHING
        RETURNING 1;
    `;
    if (res.length === 0) logger().error(`looks like claim for [actor ${actor}; launch ${tokenLaunch}] already exists`);
}
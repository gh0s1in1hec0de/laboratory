import type { UserActionType, SqlClient, UserAction } from "./types";
import type { RawAddressString } from "starton-periphery";
import { ok as assert } from "assert";
import { globalClient } from "./db";
import { logger } from "../logger";

export async function storeUserAction(
    {
        actor,
        tokenLaunch,
        actionType,
        whitelistTons,
        publicTons,
        jettons,
        timestamp,
        queryId
    }: UserAction,
    client?: SqlClient
): Promise<void> {
    const res = await (client || globalClient)`
        INSERT INTO user_actions
        (actor, token_launch, action_type, whitelist_tons, public_tons, jettons, timestamp, query_id)
        VALUES (${actor}, ${tokenLaunch}, ${actionType}, ${whitelistTons}, ${publicTons}, ${jettons}, ${timestamp},
                ${queryId})
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

export async function storeUserActions(userActions: UserAction[]) {
    const logger = logger();
    try {
        await globalClient.begin(async txClient => {
            for (const action of userActions) {
                await storeUserAction(action, txClient);
            }
        });
    } catch (e) {
        const actor = userActions[0].actor;
        const timestamp = userActions[0].timestamp;
        logger.error(`failed to record user actions fo ${actor}[${timestamp}] in tx with error: ${e}`);
    }
}
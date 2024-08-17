import type { Client, StoredTokenLaunch } from "./types";
import type { LamportTime, RawAddressString } from "../utils";
import { globalClient } from "./db";
import { ok as assert } from "assert";

// Returns `null` to show that nothing was found the explicit way
export async function getActiveTokenLaunches(client?: Client): Promise<StoredTokenLaunch[] | null> {
    const res = await (client || globalClient)<StoredTokenLaunch[]>`
        SELECT *
        FROM token_launches
        WHERE end_time - now() > INTERVAL '30 seconds';
    `;
    assert(res.length > 0, "no active launches found");
    return res;
}

export async function getTokenLaunch(address: RawAddressString, client?: Client): Promise<StoredTokenLaunch> {
    const res = await (client || globalClient)<StoredTokenLaunch[]>`
        SELECT * FROM token_launches WHERE address = ${address}
    `;
    assert(res.length === 1, `exactly 1 column must be returned, got: ${res}`);
    return res[0];
}

export async function getTokenLaunchHeight(address: RawAddressString, client?: Client): Promise<LamportTime> {
    const res = await (client || globalClient)<{ height: LamportTime }[]>`
        SELECT height FROM token_launches WHERE address = ${address}
    `;
    assert(res.length === 1, `exactly 1 column must be returned, got: ${res}`);
    return res[0].height;
}

export async function setTokenLaunchHeight(address: RawAddressString, height: LamportTime, client?: Client): Promise<void> {
    const res = await (client || globalClient)`
        UPDATE token_launches SET height = ${height} WHERE address = ${address}
    `;
    assert(res.length === 1, `exactly 1 column must be returned, got: ${res}`);
}
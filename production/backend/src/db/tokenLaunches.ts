import type {Client, StoredTokenLaunch} from "./types.ts";
import type {RawAddressString} from "../utils.ts";
import {globalClient} from "./db.ts";
import {ok as assert} from "assert";

// Returns `null` to show that nothing was found the explicit way
export async function getActiveTokenLaunches(client?: Client): Promise<StoredTokenLaunch[] | null> {
    const res = await (client || globalClient)<StoredTokenLaunch[]>`
        SELECT *
        FROM token_launches
        WHERE end_time - now() > INTERVAL '30 seconds';
    `;
    assert(res.length > 0, `no active launches found`);
    return res;
}

export async function getTokenLaunch(address: RawAddressString, client?: Client): Promise<StoredTokenLaunch> {
    const res = await (client || globalClient)<StoredTokenLaunch[]>`
        SELECT * FROM token_launches WHERE address = ${address}
    `;
    assert(res.length === 1, `exactly 1 column must be returned, got: ${res}`);
    return res[0];
}

export async function getTokenLaunchHeight(address: RawAddressString, client?: Client): Promise<Date> {
    const res = await (client || globalClient)<{ last_action_time: Date }[]>`
        SELECT height FROM token_launches WHERE address = ${address}
    `;
    assert(res.length === 1, `exactly 1 column must be returned, got: ${res}`);
    return res[0].last_action_time;
}

export async function setCoreHeight(height: bigint, client?: Client): Promise<void> {
    const res = await (client || globalClient)`
        INSERT INTO global_settings (setting_key, setting_value)
        VALUES ('core_height', ${height})
        ON CONFLICT (setting_key)
            DO UPDATE SET setting_value = EXCLUDED.setting_value
        RETURNING 1;
    `;
    assert(res.length === 1, `exactly 1 column must be created/updated, got: ${res}`);
}

export async function getCoreHeight(client?: Client): Promise<Date> {
    const res = await (client || globalClient)<{ core_height: Date }[]>`
        SELECT setting_value AS core_height
        FROM global_settings
        WHERE setting_key = 'core_height';
    `;
    assert(res.length === 1, `exactly 1 column must be returned, got: ${res}`);
    return res[0].core_height;
}
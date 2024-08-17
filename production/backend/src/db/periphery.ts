import type { Client } from "./types.ts";
import { globalClient } from "./db.ts";
import { ok as assert } from "assert";

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
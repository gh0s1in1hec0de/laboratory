import type { LamportTime, RawAddressString } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db";

export async function setHeightForAddress(address: RawAddressString, height: LamportTime, force?: boolean, client?: SqlClient): Promise<void> {
    const c = client ?? globalClient;
    await c`
        INSERT INTO heights (contract_address, height)
        VALUES (${address}, ${height})
            ${force ? c`ON CONFLICT (contract_address) DO UPDATE SET height = EXCLUDED.height;` : c`ON CONFLICT (contract_address) DO NOTHING`}
    `;
}

export async function getHeight(address: RawAddressString, client?: SqlClient): Promise<LamportTime | null> {
    const res = await (client ?? globalClient)<{ height: LamportTime }[]>`
        SELECT height
        from heights
        WHERE contract_address = ${address}
    `;
    return res.length ? res[0].height : null;
}

export async function getLaunchHeight(address: RawAddressString, client?: SqlClient): Promise<LamportTime | null> {
    const res = await (client ?? globalClient)<{ lt: LamportTime }[]>`
        SELECT lt
        FROM user_actions
        WHERE token_launch = ${address}
        ORDER BY timestamp DESC
        LIMIT 1
    `;
    return res.length ? res[0].lt : null;
}
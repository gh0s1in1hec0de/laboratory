import type { LamportTime, RawAddressString } from "../utils";
import type { SqlClient } from "./types";
import { ok as assert } from "assert";
import { globalClient } from "./db";

export async function setHeight(address: RawAddressString, height: LamportTime, client?: SqlClient): Promise<void> {
    const res = await (client || globalClient)`
        INSERT INTO heights (contract_address, height)
        VALUES (${address}, ${height})
        ON CONFLICT (contract_address)
            DO UPDATE SET height = EXCLUDED.height;
    `;
    assert(res.length === 1, `exactly 1 column must be created/updated, got: ${res}`);
}

export async function getHeight(address: RawAddressString, client?: SqlClient): Promise<LamportTime | null> {
    const res = await (client || globalClient)<{ height: LamportTime }[]>`
        SELECT height
        FROM heights
        WHERE contract_address = ${address}
    `;
    return res.length ? res[0].height : null;
}
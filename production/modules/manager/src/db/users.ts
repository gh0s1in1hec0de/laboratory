import type { Caller, SqlClient } from "./types";
import { globalClient } from "./db.ts";
import type { RawAddressString } from "starton-periphery";

export async function getCaller(
    callerAddress: RawAddressString,
    client?: SqlClient
): Promise<Caller | null> {
    const res = await (client ?? globalClient)<Caller[]>`
        SELECT *
        FROM callers
        WHERE address = ${callerAddress}
    `;
    return res.length ? res[0] : null;
}

export async function connectWallet(
    callerAddress: RawAddressString,
    referral?: string,
    client?: SqlClient
): Promise<Caller | null> {
    const res = await (client ?? globalClient)<Caller[]>`
        INSERT INTO callers (address, invited_by)
        VALUES (
            ${callerAddress},
            ${referral ? referral : null}
        )
        ON CONFLICT DO NOTHING
        RETURNING *;
    `;

    return res.length ? res[0] : null;
}

export async function getTicketBalance(
    callerAddress: RawAddressString,
    client?: SqlClient
): Promise<number | null> {
    const res = await (client ?? globalClient)<{ ticketBalance: number }[]>`
        SELECT ticket_balance
        FROM callers
        WHERE address = ${callerAddress}
    `;
    return res.length ? res[0].ticketBalance : null;
}

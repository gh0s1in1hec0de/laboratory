import type { RawAddressString, Caller } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db";
import { logger } from "../logger.ts";

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

export async function getCallerById(
    callerId: number,
    client?: SqlClient
): Promise<Caller | null> {
    const res = await (client ?? globalClient)<Caller[]>`
        SELECT *
        FROM callers
        WHERE caller_id = ${callerId}
    `;
    return res.length ? res[0] : null;
}

export async function connectWallet(
    callerAddress: RawAddressString,
    referral?: string,
    initialTicketBalance?: number,
    client?: SqlClient
): Promise<Caller | null> {
    const res = await (client ?? globalClient)<Caller[]>`
        INSERT INTO callers (address, invited_by, ticket_balance)
        VALUES (${callerAddress}, ${referral ?? null}, ${initialTicketBalance ?? 2})
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

export async function decrementTicketBalance(
    callerAddress: RawAddressString,
    client?: SqlClient
): Promise<void> {
    const res = await (client ?? globalClient)`
        UPDATE callers
        SET ticket_balance = ticket_balance - 1
        WHERE address = ${callerAddress}
        RETURNING 1;
    `;
    if (res.length !== 1) logger().warn(`exactly 1 column must be created, got: ${res}`);
}


import type { Caller } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db.ts";

export async function getCaller(address: string, client?: SqlClient): Promise<Caller | null> {
    const res = await (client ?? globalClient)<Caller[]>`
        SELECT *
        FROM callers
        WHERE address = ${address}
    `;
    return res.length ? res[0] : null;
}

export async function connectWallet(address: string, client?: SqlClient): Promise<Caller | null> {
    const res = await (client ?? globalClient)<Caller[]>`
        INSERT INTO callers (address)
        VALUES (${address})
        ON CONFLICT DO NOTHING
        RETURNING *;
    `;

    return res.length ? res[0] : null;
}

export async function getTicketBalance(address: string, client?: SqlClient): Promise<number | null> {
    const res = await (client ?? globalClient)<{ ticketBalance: number }[]>`
        SELECT ticket_balance
        FROM callers
        WHERE address = ${address}
    `;
    return res.length ? res[0].ticketBalance : null;
}

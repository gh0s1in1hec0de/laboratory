import type { NewCaller, SqlClient } from "./types";
import { globalClient } from "./db.ts";

// todo maybe delete this?
// export async function getAddressOwner(address: string, client?: SqlClient): Promise<TelegramId | null> {
//     const res = await (client ?? globalClient)<{ telegramId: TelegramId }[]>`
//         SELECT *
//         FROM callers
//         WHERE address = ${address}
//     `;
//     return res.length ? res[0].telegramId : null;
// }

export async function getCaller(address: string, client?: SqlClient): Promise<NewCaller | null> {
    const res = await (client ?? globalClient)<NewCaller[]>`
        SELECT *
        FROM callers
        WHERE address = ${address}
    `;
    return res.length ? res[0] : null;
}

export async function connectWallet(address: string, client?: SqlClient): Promise<NewCaller | null> {
    const res = await (client ?? globalClient)<NewCaller[]>`
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

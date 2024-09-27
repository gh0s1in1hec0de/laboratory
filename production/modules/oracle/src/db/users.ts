import type { SqlClient, TelegramId } from "./types.ts";
import { globalClient } from "./db.ts";

export async function getAddressOwner(address: string, client?: SqlClient): Promise<TelegramId | null> {
    const res = await (client ?? globalClient)<{ telegramId: TelegramId }[]>`
        SELECT "user"
        FROM callers
        WHERE address = ${address}
    `;
    return res.length ? res[0].telegramId : null;
}

export async function connectWallet(address: string, client?: SqlClient): Promise<void> {
    await (client ?? globalClient)`
        INSERT INTO callers (address)
        VALUES (${address})
        ON CONFLICT DO NOTHING;
    `;
}

export async function getTicketBalance(address: string, client?: SqlClient): Promise<number | null> {
    const res = await (client ?? globalClient)<{ ticketBalance: number }[]>`
        SELECT ticket_balance
        FROM callers
        WHERE address = ${address}
    `;
    return res.length ? res[0].ticketBalance : null;
}

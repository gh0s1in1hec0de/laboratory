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
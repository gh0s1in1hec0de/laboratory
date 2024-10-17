import type { LaunchMetadata } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db";
import { logger } from "../logger";

export async function createLaunchMetadata(
    { onchainMetadataLink, telegramLink, xLink, website, extra }: LaunchMetadata,
    client?: SqlClient
): Promise<void> {
    const res = await (client ?? globalClient)`
        INSERT INTO launch_metadata (onchain_metadata_link, telegram_link, x_link, website, extra)
        VALUES (${onchainMetadataLink}, ${telegramLink ?? null}, ${xLink ?? null}, ${website ?? null}, ${extra ?? null})
        RETURNING 1
    `;
    if (res.length !== 1) logger().warn(`exactly 1 column must be created, got: ${res}`);
}

export async function getLaunchesMetadata(onchainMetadataLinks: string[], client?: SqlClient): Promise<LaunchMetadata[] | null> {
    const res = await (client ?? globalClient)<LaunchMetadata[]>`
        SELECT *
        FROM launch_metadata
        WHERE onchain_metadata_link = ANY (${onchainMetadataLinks});
    `;
    return res.length ? res : null;
}
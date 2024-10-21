import type { LaunchMetadata } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db";
import { logger } from "../logger";

export async function storeLaunchMetadata(
    { onchainMetadataLink, telegramLink, xLink, website, influencerSupport }: LaunchMetadata,
    client?: SqlClient
): Promise<void> {
    const res = await (client ?? globalClient)`
        INSERT INTO launch_metadata (onchain_metadata_link, telegram_link, x_link, website, influencer_support)
        VALUES (${onchainMetadataLink}, ${telegramLink ?? null}, ${xLink ?? null}, ${website ?? null}, ${influencerSupport ?? null})
        RETURNING 1
    `;
    if (res.length !== 1) logger().warn(`exactly 1 column must be created, got: ${res}`);
}
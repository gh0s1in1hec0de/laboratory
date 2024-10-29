import type { LamportTime, LaunchMetadata, RawAddressString } from "starton-periphery";
import type { SqlClient } from "./types";
import { globalClient } from "./db";
import { logger } from "manager/src/logger.ts";

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

export async function getLaunchWithTopActivity(client?: SqlClient) {
    const res = await (client ?? globalClient)<{ tokenLaunch: RawAddressString, actionCount: number }[]>`
        SELECT token_launch, action_count
        FROM top_token_launch_by_actions
    `;
    return res.length ?
        res.map(({ tokenLaunch, actionCount }) =>
            ({ tokenLaunch, actionCount })
        )[0] : null;
}

export async function getLaunchesMetadata(onchainMetadataLinks: string[], client?: SqlClient): Promise<LaunchMetadata[] | null> {
    const res = await (client ?? globalClient)<LaunchMetadata[]>`
        SELECT *
        FROM launch_metadata
        WHERE onchain_metadata_link = ANY (${onchainMetadataLinks});
    `;
    return res.length ? res : null;
}


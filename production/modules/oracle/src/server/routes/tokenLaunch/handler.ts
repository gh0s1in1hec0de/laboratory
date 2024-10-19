import { type StoredTokenLaunchRequest, type StoredTokenLaunchResponse } from "starton-periphery";
import * as db from "../../../db";

export async function getTokenLaunches(
    { orderBy, page, order, search = "", limit }: StoredTokenLaunchRequest
): Promise<StoredTokenLaunchResponse> {
    return await db.getSortedTokenLaunches(
        { page, limit, orderBy, order, search: search.replace(/\+/g, " ") }
    ) ?? { launchesChunk: [], hasMore: false };
}
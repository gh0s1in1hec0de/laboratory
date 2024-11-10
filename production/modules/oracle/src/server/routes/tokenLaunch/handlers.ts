import { CommonServerError, LaunchSortParameters, SortingOrder } from "starton-periphery";
import * as db from "../../../db";
import type {
    GetLaunchesChunkResponse,
    GetCertainLaunchResponse,
    GetLaunchesChunkRequest,
    GetCertainLaunchRequest,
    GetRisingStarResponse
} from "starton-periphery";

export async function getLaunchesChunk(req: GetLaunchesChunkRequest): Promise<GetLaunchesChunkResponse> {
    return await db.getSortedTokenLaunches({
        ...req, search: req.search?.replace(/\+/g, " ") ?? ""
    }) ?? { launchesChunk: [], hasMore: false };
}

// For creator filtering may return `NOT_STARTED` launch
export async function getCertainLaunch(
    { creator, address, metadataUri }: GetCertainLaunchRequest
): Promise<GetCertainLaunchResponse> {
    if (!creator && !address && !metadataUri) throw new CommonServerError(400, "at least one of parameters must be provided");
    return await db.getLaunch({ creator, address, metadataUri });
}

export async function getRisingStar(): Promise<GetRisingStarResponse> {
    const risingStar = await db.getLaunchWithTopActivity();
    const address = risingStar?.tokenLaunch ?? await db.getSortedTokenLaunches({
        page: 1,
        limit: 6,
        order: SortingOrder.HIGH_TO_LOW,
        orderBy: LaunchSortParameters.TOTAL_TONS_COLLECTED
    }).then(r => r?.launchesChunk[r.launchesChunk.length - 1]?.address);
    if (!address) throw new CommonServerError(500, "rising star not found");

    return await db.getLaunch({ address });
}

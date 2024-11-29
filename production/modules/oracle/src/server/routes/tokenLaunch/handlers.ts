import { CommonServerError, SortingOrder, LaunchSortParameters } from "starton-periphery";
import { analyzeLaunchTrend } from "../../../utils";
import * as db from "../../../db";
import type {
    GetLaunchesChunkResponse,
    GetCertainLaunchResponse,
    GetLaunchesChunkRequest,
    GetCertainLaunchRequest,
    GetRisingStarResponse,
} from "starton-periphery";

export async function getLaunchesChunk(req: GetLaunchesChunkRequest): Promise<GetLaunchesChunkResponse> {
    return await db.getSortedTokenLaunches(
        { ...req, search: req.search?.replace(/\+/g, " ") ?? "" }
    ) ?? { launchesChunk: [], hasMore: false };
}

// For creator filtering may return `NOT_STARTED` launch
export async function getCertainLaunch(
    { creator, address, metadataUri }: GetCertainLaunchRequest
): Promise<GetCertainLaunchResponse> {
    if (!creator && !address && !metadataUri) throw new CommonServerError(400, "At least one parameter must be provided");
    const launch = await db.getLaunch({ creator, address, metadataUri });
    if (!launch) throw new CommonServerError(500, "Launch not found");

    const now = Math.floor(Date.now() / 1000);
    const tradingStats = (now > launch.timings.creatorRoundEndTime && now < launch.timings.publicRoundEndTime)
        ? analyzeLaunchTrend(await db.getLastActionsForLaunch(launch.address) ?? [])
        : undefined;

    return { ...launch, tradingStats };
}

export async function getRisingStar(): Promise<GetRisingStarResponse> {
    const risingStar = await db.getLaunchWithTopActivity();
    const address = risingStar?.tokenLaunch ?? await db.getSortedTokenLaunches({
        page: 1,
        limit: 6,
        order: SortingOrder.HIGH_TO_LOW,
        orderBy: LaunchSortParameters.TOTAL_TONS_COLLECTED
    }).then(r => r?.launchesChunk[0]?.address);
    if (!address) throw new CommonServerError(500, "rising star not found");
    return await db.getLaunch({ address });
}

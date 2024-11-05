import { CommonServerError } from "starton-periphery";
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
    const res = await db.getLaunchWithTopActivity();
    if (!res) throw new CommonServerError(500, "unreachable: top activity launch not found");
    return await db.getLaunch({ address: res.tokenLaunch });
}

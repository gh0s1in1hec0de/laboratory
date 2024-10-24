import type {
    GetLaunchesChunkResponse,
    GetCertainLaunchResponse,
    GetLaunchesChunkRequest,
    GetCertainLaunchRequest,
    GetRisingStarResponse
} from "starton-periphery";
import { CommonServerError } from "starton-periphery";
import * as db from "../../../db";

export async function getLaunchesChunk(req: GetLaunchesChunkRequest): Promise<GetLaunchesChunkResponse> {
    return await db.getSortedTokenLaunches({
        ...req, search: req.search?.replace(/\+/g, " ") ?? ""
    }) ?? { launchesChunk: [], hasMore: false };
}

export async function getCertainLaunch(
    { address, metadataUri }: GetCertainLaunchRequest
): Promise<GetCertainLaunchResponse> {
    if (!address && !metadataUri) throw new CommonServerError(400, "at least one of parameters must be provided");
    return await db.getLaunch({ address, metadataUri });
}

export async function getRisingStar(): Promise<GetRisingStarResponse> {
    const res = await db.getLaunchWithTopActivity();
    if (!res) throw new CommonServerError(500, "unreachable: top activity launch not found");
    return await db.getLaunch({ address: res.tokenLaunch });
}

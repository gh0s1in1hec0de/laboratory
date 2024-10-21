import * as db from "../../../db";
import {
    type StoredTokenLaunchResponse,
    type StoredTokenLaunchRequest,
    type CertainLaunchRequest,
    type ExtendedLaunchWithMetadata,
    CommonServerError,
} from "starton-periphery";

export async function getLaunchesChunk(req: StoredTokenLaunchRequest): Promise<StoredTokenLaunchResponse> {
    return await db.getSortedTokenLaunches({
        ...req, search: req.search?.replace(/\+/g, " ") ?? ""
    }) ?? { launchesChunk: [], hasMore: false };
}

export async function getCertainLaunch({ address, metadataUri }: CertainLaunchRequest): Promise<ExtendedLaunchWithMetadata | null> {
    if (!address && !metadataUri) throw new CommonServerError(400, "at least one of parameters must be provided");
    return await db.getLaunch({ address, metadataUri });
}

export async function getRisingStar(): Promise<ExtendedLaunchWithMetadata | null> {
    const res = await db.getLaunchWithTopActivity();
    if (!res) throw new CommonServerError(500, "unreachable: top activity launch not found");
    return await db.getLaunch({ address: res.tokenLaunch });
}

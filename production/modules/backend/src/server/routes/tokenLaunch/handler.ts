import { getSortedTokenLaunches, type StoredTokenLaunchResponse } from "../../../db";
import type { GetTokenLaunchesRequest } from "./types";
import { logger } from "../../../logger.ts";
import { ok as assert } from "assert";

export async function getTokenLaunches({
    sort,
    page,
    order,
    search = "",
    limit
}: GetTokenLaunchesRequest): Promise<StoredTokenLaunchResponse | undefined> {
    try{
        const res = await getSortedTokenLaunches(
            page,
            limit,
            sort,
            order,
            search
        );
        assert(res, "token launches not found");
        return res;
    } catch (e){
        logger().http(`function retrieval error: ${e}`);
    }
}
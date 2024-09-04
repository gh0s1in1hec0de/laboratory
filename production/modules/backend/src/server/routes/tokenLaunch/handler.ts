import { getSortedTokenLaunches, type StoredTokenLaunchRequest, type StoredTokenLaunchResponse } from "../../../db";
import { logger } from "../../../logger";
import { ok as assert } from "assert";

export async function getTokenLaunches({
    sortBy,
    page,
    order,
    search = "",
    limit
}: StoredTokenLaunchRequest): Promise<StoredTokenLaunchResponse | undefined> {
    try {
        const res = await getSortedTokenLaunches({
            page,
            limit,
            sortBy: sort,
            order,
            search: search.replace(/\+/g, " ")
        });
        assert(res, "token launches not found");
        return res;
    } catch (e){
        logger().http(`function retrieval error: ${e}`);
    }
}
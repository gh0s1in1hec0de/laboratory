import { logger } from "../../../logger";
import { ok as assert } from "assert";
import * as db from "../../../db";

export async function getTokenLaunches({
    orderBy,
    page,
    order,
    search = "",
    limit
}: db.StoredTokenLaunchRequest): Promise<db.StoredTokenLaunchResponse | undefined> {
    try {
        const res = await db.getSortedTokenLaunches({
            page,
            limit,
            orderBy,
            order,
            search: search.replace(/\+/g, " ")
        });
        assert(res, "token launches not found");
        return res;
    } catch (e){
        logger().error(`error in http request 'getTokenLaunches': ${e}`);
    }
}
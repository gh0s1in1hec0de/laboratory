import { CommonServerError } from "starton-periphery";
import * as db from "../../../db";

export async function getTokenLaunches({
    orderBy,
    page,
    order,
    search = "",
    limit
}: db.StoredTokenLaunchRequest): Promise<db.StoredTokenLaunchResponse | undefined> {
    const res = await db.getSortedTokenLaunches({
        page,
        limit,
        orderBy,
        order,
        search: search.replace(/\+/g, " ")
    });
    if (!res) throw new CommonServerError(500, "Launches not found");
    return res;
}
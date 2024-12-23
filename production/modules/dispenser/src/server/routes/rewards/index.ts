import { getAmount, getLaunchesRewardPools, getRewardJettonBalances, getRewardPositions } from "./handlers";
import { GetPositionsOrAmountSchema, GetRewardBalancesSchema, GetRewardPoolsSchema } from "./types";
import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { CommonServerError } from "starton-periphery";
import { authMiddleware } from "../auth";
import Elysia from "elysia";

export function RewardRoutes() {
    return new Elysia({ prefix: "/rewards" })
        .get(
            "/get-reward-pools",
            async ({ query, error }) => {
                try {
                    return await getLaunchesRewardPools({ tokenLaunches: JSON.parse(query.tokenLaunches) });
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                query: GetRewardPoolsSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        )
        .onBeforeHandle(authMiddleware)
        .get(
            "/get-amount",
            async ({ query, error }) => {
                try {
                    return await getAmount(query);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                query: GetPositionsOrAmountSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        )
        .get(
            "/get-reward-positions",
            async ({ query, error }) => {
                try {
                    return await getRewardPositions(query);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                query: GetPositionsOrAmountSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        )
        .get(
            "/get-reward-balances",
            async ({ query, error }) => {
                try {
                    return await getRewardJettonBalances(query);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                query: GetRewardBalancesSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        );
}

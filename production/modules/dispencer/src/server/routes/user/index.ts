import { getAmount, getLaunchRewardPools, getRewardBalances, getRewardPositions } from "./handlers";
import { GetPositionsOrAmountSchema, GetRewardBalancesSchema, GetRewardPoolsSchema } from "./types";
import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { CommonServerError } from "starton-periphery";
import { authMiddleware } from "../auth";
import Elysia from "elysia";

export function rewardRoutes() {
    return new Elysia({ prefix: "/rewards" })
        .get(
            "/get-reward-pools",
            async ({ body, error }) => {
                try {
                    return await getLaunchRewardPools(body);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                body: GetRewardPoolsSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        )
        .onBeforeHandle(authMiddleware)
        .get(
            "/get-amount",
            async ({ body, error }) => {
                try {
                    return await getAmount(body);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                body: GetPositionsOrAmountSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        )
        .get(
            "/get-reward-positions",
            async ({ body, error }) => {
                try {
                    return await getRewardPositions(body);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                body: GetPositionsOrAmountSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        )
        .get(
            "/get-reward-balances",
            async ({ body, error }) => {
                try {
                    return await getRewardBalances(body);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                body: GetRewardBalancesSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        );
}

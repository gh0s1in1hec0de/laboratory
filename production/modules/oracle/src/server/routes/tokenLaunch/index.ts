import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { CommonServerError } from "starton-periphery";
import { GetTokenLaunchesSchema } from "./types";
import { getTokenLaunches } from "./handler";
import Elysia from "elysia";

export function TokenLaunchRoutes() {
    return new Elysia({ prefix: "/tokenLaunches" })
        .get(
            "/",
            async ({ query, error }) => {
                try {
                    return await getTokenLaunches(query);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                query: GetTokenLaunchesSchema,
                ...createDetailsForEndpoint(SwaggerTags.TokenLaunch)
            }
        );
}
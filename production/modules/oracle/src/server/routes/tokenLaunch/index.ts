import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { CommonServerError } from "starton-periphery";
import { GetTokenLaunchesSchema, GetTokenLaunchSchema } from "./types";
import { getCertainLaunch, getLaunchesChunk } from "./handlers";
import Elysia from "elysia";

export function TokenLaunchRoutes() {
    return new Elysia({ prefix: "/tokenLaunches" })
        .get(
            "/get-chunk",
            async ({ query, error }) => {
                try {
                    return await getLaunchesChunk(query);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                query: GetTokenLaunchesSchema,
                ...createDetailsForEndpoint(SwaggerTags.TokenLaunch)
            }
        )
        .get(
            "/get-certain",
            async ({ query, error }) => {
                try {
                    return await getCertainLaunch(query);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                query: GetTokenLaunchSchema,
                ...createDetailsForEndpoint(SwaggerTags.TokenLaunch)
            }
        );
}
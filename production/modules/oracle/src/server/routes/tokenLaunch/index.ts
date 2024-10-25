import { getCertainLaunch, getLaunchesChunk, getRisingStar } from "./handlers";
import { GetTokenLaunchesSchema, GetTokenLaunchSchema } from "./types";
import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { CommonServerError } from "starton-periphery";
import Elysia from "elysia";

export function TokenLaunchRoutes() {
    return new Elysia({ prefix: "/tokenLaunches" })
        .get(
            "/get-chunk",
            async ({ query, error }) => {
                try {
                    return await getLaunchesChunk({
                        ...query,
                        succeed: query.succeed === "true" ? true : query.succeed === "false" ? false : undefined
                    });
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
        )
        .get(
            "/get-certain",
            async ({ error }) => {
                try {
                    return await getRisingStar();
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                ...createDetailsForEndpoint(SwaggerTags.TokenLaunch)
            }
        );
}
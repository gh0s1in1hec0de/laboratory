import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { GetTokenLaunchesSchema } from "./types";
import { getTokenLaunches } from "./handler";
import Elysia from "elysia";

export function TokenLaunchRoutes() {
    return new Elysia({ prefix: "/tokenLaunches" })
        .get(
            "/",
            ({
                query: {
                    page,
                    limit,
                    sort,
                    order,
                    search
                }
            }) => getTokenLaunches({
                page,
                limit,
                sort,
                order,
                search
            }),
            {
                query: GetTokenLaunchesSchema,
                ...createDetailsForEndpoint(SwaggerTags.TokenLaunch)
            }
        );
}
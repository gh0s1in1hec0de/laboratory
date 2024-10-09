import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { getAmountSchema } from "./types";
import { authMiddleware } from "../auth";
import { getAmount } from "./handlers";
import Elysia from "elysia";

export function UserRoutes() {
    return new Elysia({ prefix: "/user" })
        .post(
            "/get-amount",
            async ({ body }) => await getAmount(body),
            {
                body: getAmountSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        )
        .onBeforeHandle(authMiddleware);
}

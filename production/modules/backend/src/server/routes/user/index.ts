import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { getGreeting } from "./handlers.ts";
import Elysia from "elysia";

export function UserRoutes(){
    return new Elysia({ prefix: "/user" })
        .get(
            "/",
            () => getGreeting(),
            createDetailsForEndpoint(SwaggerTags.User)
        );
}
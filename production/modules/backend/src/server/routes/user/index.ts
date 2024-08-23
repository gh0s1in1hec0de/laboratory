import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { getGreeting } from "./handlers.ts";
import Elysia from "elysia";

export const userRoutes = new Elysia({ prefix: "/user" })
    .get(
        "/",
        () => getGreeting(),
        createDetailsForEndpoint(SwaggerTags.User)
    );

// export default function () {
//     return new Elysia({ prefix: "/user" })
//         .get(
//             "/",
//             () => getGreeting(),
//             createDetailsForEndpoint(SwaggerTags.User)
//         );
// }
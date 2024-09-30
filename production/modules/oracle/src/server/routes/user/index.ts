import Elysia from "elysia";
import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { authMiddleware } from "../auth";
import { connectWallet, getTasks, getTicketBalance } from "./handlers";
import { ConnectWalletSchema, GetTicketBalanceSchema } from "./types";

export function UserRoutes() {
    return new Elysia({ prefix: "/user" })
        .post(
            "/connect-wallet",
            ({ body }) => connectWallet(body),
            {
                body: ConnectWalletSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        )
        .onBeforeHandle(authMiddleware)
        .get(
            "/ticket-balance",
            ({ query }) => getTicketBalance(query),
            {
                query: GetTicketBalanceSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        )
        .get(
            "/tasks",
            () => getTasks(),
            createDetailsForEndpoint(SwaggerTags.User)
        );
}

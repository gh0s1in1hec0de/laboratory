import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { ConnectWalletSchema, GetTasksSchema, GetTicketBalanceSchema } from "./types";
import { connectWallet, getTasks, getTicketBalance } from "./handlers";
import Elysia from "elysia";

export function UserRoutes() {
    return new Elysia({ prefix: "/user" })
        .post(
            "/connect-wallet",
            ({ body }) => connectWallet(body),
            {
                body: ConnectWalletSchema,
                ...createDetailsForEndpoint(SwaggerTags.TokenLaunch)
            }
        )
        .get(
            "/ticket-balance",
            ({ query }) => getTicketBalance(query),
            {
                query: GetTicketBalanceSchema,
                ...createDetailsForEndpoint(SwaggerTags.TokenLaunch)
            }
        )
        .get(
            "/tasks",
            ({ query }) => getTasks(query),
            {
                query: GetTasksSchema,
                ...createDetailsForEndpoint(SwaggerTags.TokenLaunch)
            }
        );
}

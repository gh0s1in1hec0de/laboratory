import Elysia from "elysia";
import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { authMiddleware } from "../auth";
import { ConnectWalletSchema, GetTasksSchema, GetTicketBalanceSchema } from "./types";
import { getCallerTasks, getCallerTicketBalance, connectCallerWallet } from "./handlers";

export function UserRoutes() {
    return new Elysia({ prefix: "/user" })
        .post(
            "/connect-wallet",
            ({ body }) => connectCallerWallet(body),
            {
                body: ConnectWalletSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        )
        .get(
            "/tasks",
            ({ query }) => getCallerTasks(query),
            {
                query: GetTasksSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        )
        .onBeforeHandle(authMiddleware)
        .get(
            "/ticket-balance",
            ({ query }) => getCallerTicketBalance(query),
            {
                query: GetTicketBalanceSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        );
}

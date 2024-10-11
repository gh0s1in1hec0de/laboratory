import { getCallerTasks, getCallerTicketBalance, connectCallerWallet } from "./handlers";
import { ConnectWalletSchema, GetTasksSchema, GetTicketBalanceSchema } from "./types";
import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { CommonServerError } from "starton-periphery";
import { authMiddleware } from "../auth";
import Elysia from "elysia";

export function UserRoutes() {
    return new Elysia({ prefix: "/user" })
        .post(
            "/connect-wallet",
            async ({ body, error }) => {
                try {
                    return await connectCallerWallet(body);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                body: ConnectWalletSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        )
        .get(
            "/tasks",
            async ({ query, error }) => {
                try {
                    return await getCallerTasks(query);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                query: GetTasksSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        )
        .onBeforeHandle(authMiddleware)
        .get(
            "/ticket-balance",
            async ({ query, error }) => {
                try {
                    return await getCallerTicketBalance(query);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                query: GetTicketBalanceSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        );
}

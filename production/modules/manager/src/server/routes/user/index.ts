import { ConnectWalletSchema, GetWhitelistStatusSchema, GetTasksSchema, GetTicketBalanceSchema, GetCallerSchema } from "./types";
import { getCallerTasks, getCallerTicketBalance, connectCallerWallet, getWhitelistStatus, getCaller } from "./handlers";
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
        .get(
            "/get-caller",
            async ({ query, error }) => {
                try {
                    return await getCaller(query);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                query: GetCallerSchema,
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
        )
        .get(
            "/whitelist-status",
            async ({ query, error }) => {
                try {
                    return await getWhitelistStatus(query);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                query: GetWhitelistStatusSchema,
                ...createDetailsForEndpoint(SwaggerTags.User)
            }
        );
}

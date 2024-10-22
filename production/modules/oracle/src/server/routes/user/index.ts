import { createDetailsForEndpoint, SwaggerTags } from "../../config";
import { CommonServerError } from "starton-periphery";
import { connectCallerWallet, getUserBalances } from "./handlers";
import { ConnectWalletSchema, getBalancesSchema, } from "./types";
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
        .onBeforeHandle(authMiddleware)
        .get(
            "/get-balances",
            async ({ query, error }) => {
                try {
                    return await getUserBalances(query);
                } catch (e) {
                    if (e instanceof CommonServerError) return error(e.code, e.message);
                    else return error(500, e);
                }
            },
            {
                query: getBalancesSchema,
                ...createDetailsForEndpoint(SwaggerTags.TokenLaunch)
            }
        );
}

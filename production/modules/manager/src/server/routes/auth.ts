import { type Context } from "elysia";
import { Address } from "@ton/core";
import * as db from "../../db";

export async function authMiddleware(context: Context) {
    const callerAddress = context.request.headers.get("address");
    if (!callerAddress) return context.error(404, "auth error: address is required");
    const user = await db.getCaller(Address.parse(callerAddress).toRawString());
    if (!user) return context.error(401, "auth error: user not found");
}

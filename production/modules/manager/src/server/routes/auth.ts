import { type Context } from "elysia";
import * as db from "../../db";
import { Address } from "@ton/core";

export async function authMiddleware(context: Context) {
    const callerAddress = context.request.headers.get("address");
    if (!callerAddress) return context.error(400, "auth error:address is required");
    const user = await db.getCaller(Address.parse(callerAddress).toRawString());
    if (!user) return context.error(404, "auth error: user not found");
}

import { type Context } from "elysia";
import * as db from "../../db";

export async function authMiddleware(context: Context) {
    const walletAddress = context.request.headers.get("address");
    if (!walletAddress) return context.error(400, "address is required");
    const user = await db.getCaller(walletAddress);
    if (!user) return context.error(404, "user not found");
}

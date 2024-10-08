import { BotError, GrammyError, HttpError } from "grammy";
import type { MyContext } from "../index";
import { logger } from "../../logger";

export async function handleBotError(err: BotError<MyContext>): Promise<void> {
    const ctx: MyContext = err.ctx;
    logger().warn(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        logger().error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        logger().error("Could not contact Telegram:", e);
    } else {
        logger().error("Unknown error:", e);
    }
}
import { BotError, GrammyError, HttpError } from "grammy";
import type { ManagerContext } from "../index";
import { logger } from "../../logger";

export async function handleBotError(err: BotError<ManagerContext>): Promise<void> {
    const ctx: ManagerContext = err.ctx;
    logger().error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
        logger().error("Error in request:", e);
    } else if (e instanceof HttpError) {
        logger().error("Could not contact Telegram:", e);
    } else {
        logger().error("Unknown error:", e);
    }
}
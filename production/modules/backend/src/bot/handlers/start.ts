import { type CommandContext } from "grammy";
import { getStartReply } from "../constants";
import type { MyContext } from "../index";
import { logger } from "../../logger";

export async function handleStartCommand(ctx: CommandContext<MyContext>): Promise<void> {
    try {
        const startText = getStartReply(ctx);
        await ctx.reply(startText, {
            parse_mode: "HTML",
        });
    } catch (error) {
        if (error instanceof Error) {
            logger().error(error.message);
        } else {
            logger().error("Unknown error");
        }
    }
}
import { getStartKeyboard, getStartReply } from "../constants";
import { type CommandContext } from "grammy";
import type { MyContext } from "../index";
import { logger } from "../../logger";

export async function handleStartCommand(ctx: CommandContext<MyContext>): Promise<void> {
    try {
        const startText = getStartReply(ctx);
        await ctx.reply(startText, {
            parse_mode: "HTML",
            reply_markup: getStartKeyboard(ctx)
        });
        // await ctx.react(Reactions.thumbs_up);
    } catch (error) {
        if (error instanceof Error) {
            logger().error(error.message);
        } else {
            logger().error("Unknown error");
        }
    }
}
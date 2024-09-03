import { getMenuKeyboard, getMenuReply } from "../constants";
import { type CommandContext } from "grammy";
import type { MyContext } from "../index";
import { logger } from "../../logger";

export async function handleMenuCommand(ctx: CommandContext<MyContext>): Promise<void> {
    try {
        const startText = getMenuReply(ctx);
        await ctx.reply(startText, {
            parse_mode: "HTML",
            reply_markup: getMenuKeyboard()
        });
    } catch (error) {
        if (error instanceof Error) {
            logger().error(error.message);
        } else {
            logger().error("Unknown error");
        }
    }
}
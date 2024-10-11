import { getMenuKeyboard, getReplyText } from "../constants";
import type { CommandContext } from "grammy";
import type { MyContext } from "../index";
import { logger } from "../../logger";

export async function handleMenuCommand(ctx: CommandContext<MyContext>): Promise<void> {
    try {
        await ctx.reply(getReplyText("menu"), {
            parse_mode: "HTML",
            reply_markup: getMenuKeyboard()
        });
    } catch (error) {
        if (error instanceof Error) {
            logger().error("Error in menu command: ", error.message);
        } else {
            logger().error("Unknown error");
        }
    }
}
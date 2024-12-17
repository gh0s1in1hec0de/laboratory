import { type CommandContext } from "grammy";
import { getReplyText } from "../constants";
import type { ManagerContext } from "../index";
import { logger } from "../../logger";

export async function handleStartCommand(ctx: CommandContext<ManagerContext>): Promise<void> {
    try {
        const activeConversations = await ctx.conversation.active();
        if (Object.keys(activeConversations).length > 0) await ctx.conversation.exit();

        await ctx.reply(getReplyText("start"), {
            parse_mode: "HTML",
        });
    } catch (error) {
        if (error instanceof Error) {
            logger().error("Error in start command: ", error.message);
        } else {
            logger().error("Unknown error");
        }
    }
}
import { cancelConversationKeyboard, Conversations, getReplyText } from "../constants";
import type { MyContext, MyConversation } from "..";
import { parseTasksInputToMergedMap } from "./common";
import { logger } from "../../logger";
import * as db from "../../db";

export async function createTask(conversation: MyConversation, ctx: MyContext): Promise<void> {
    await ctx.reply(getReplyText("createTaskRequest"),
        { parse_mode: "HTML", reply_markup: cancelConversationKeyboard(Conversations.createTask) }
    );

    let progress = false;
    do {
        const { msg: { text } } = await conversation.waitFor("message:text");

        const { tasksByLocale, errors } = parseTasksInputToMergedMap(text);

        if (errors.length) {
            await ctx.reply(getReplyText("invalidAddTasks") + "\n" + errors.join("\n"), {
                parse_mode: "HTML",
                reply_markup: cancelConversationKeyboard(Conversations.createTask)
            });
            continue;
        }

        try {
            for (const [taskName, description] of tasksByLocale.entries()) {
                await db.storeTask(taskName, description);
            }
        } catch (e) {
            await ctx.reply(getReplyText("error"),
                { parse_mode: "HTML", reply_markup: cancelConversationKeyboard(Conversations.createTask) }
            );
            logger().error("Failed to add new task with error: ", e);

            continue;
        }

        progress = true;
    } while (!progress);

    await ctx.reply(getReplyText("addTasksSuccess"), {
        parse_mode: "HTML",
    });
    return;
}
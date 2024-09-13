import { getCancelConversationKeyboard, getMenuKeyboard, getReplyText } from "../constants";
import type { MyContext, MyConversation } from "..";
import { logger } from "../../logger";
import * as db from "../../db";
import {isReadyTasksToDb} from "./common.ts";

export async function createTask(conversation: MyConversation, ctx: MyContext): Promise<void> {
    await ctx.reply(getReplyText("createTaskRequest"),
        { parse_mode: "HTML", reply_markup: getCancelConversationKeyboard() }
    );

    let progress = false;
    do {
        const { msg: { text } } = await conversation.waitFor("message:text");
        const res = isReadyTasksToDb(text);

        if (!res) {
            await ctx.reply(getReplyText("invalidAddTasks"), {
                parse_mode: "HTML",
                reply_markup: getCancelConversationKeyboard()
            });
            continue;
        }

        try {
            for (const [taskName, description] of res.entries()) {
                await db.storeTask(taskName, description);
            }
        } catch (error) {
            await ctx.reply(getReplyText("error"),
                { parse_mode: "HTML", reply_markup: getCancelConversationKeyboard() }
            );
            if (error instanceof Error) {
                logger().error("error in db when adding to table 'Tasks'",error.message);
            } else {
                logger().error("unknown error");
            }
            continue;
        }

        progress = true;
    } while (!progress);

    await ctx.reply(getReplyText("addTasksSuccess"));
    return;
}
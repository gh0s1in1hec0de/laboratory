import { getCancelCreateTaskConvKeyboard, getReplyText } from "../constants";
import type { MyContext, MyConversation } from "..";
import { isReadyTasksToDb } from "./common";
import { logger } from "../../logger";
import * as db from "../../db";

export async function createTask(conversation: MyConversation, ctx: MyContext): Promise<void> {
    await ctx.reply(getReplyText("createTaskRequest"),
        { parse_mode: "HTML", reply_markup: getCancelCreateTaskConvKeyboard() }
    );

    let progress = false;
    do {
        const { msg: { text } } = await conversation.waitFor("message:text");
        
        const { validMap, errors } = isReadyTasksToDb(text);

        if (errors.length) {
            await ctx.reply(getReplyText("invalidAddTasks") + "\n" + errors.join("\n"), {
                parse_mode: "HTML",
                reply_markup: getCancelCreateTaskConvKeyboard()
            });
            continue;
        }

        try {
            for (const [taskName, description] of validMap.entries()) {
                await db.storeTask(taskName, description);
            }
        } catch (error) {
            await ctx.reply(getReplyText("error"),
                { parse_mode: "HTML", reply_markup: getCancelCreateTaskConvKeyboard() }
            );
            if (error instanceof Error) {
                logger().error("error in db when adding to table 'Tasks'", error.message);
            } else {
                logger().error("unknown error");
            }
            continue;
        }

        progress = true;
    } while (!progress);

    await ctx.reply(getReplyText("addTasksSuccess"), {
        parse_mode: "HTML",
    });
    return;
}
import type { StoredTask } from "starton-periphery";
import type { ManagerContext, MyConversation } from "..";
import { logger } from "../../logger";
import * as db from "../../db";
import {
    getConfirmDeleteTaskConvKeyboard,
    cancelConversationKeyboard,
    Conversations,
    getReplyText
} from "../constants";

export async function deleteTask(conversation: MyConversation, ctx: ManagerContext): Promise<void> {
    await ctx.reply(getReplyText("deleteTaskRequest"),
        { parse_mode: "HTML", reply_markup: cancelConversationKeyboard(Conversations.deleteTask) }
    );

    let progress = false;
    do {
        const { msg: { text } } = await conversation.waitFor("message:text");

        const errors: string[] = [];
        const tasks: StoredTask[] = [];

        try {
            for (const taskId of text.split(",")) {
                if (isNaN(Number(taskId))) {
                    errors.push(`Error with taskId = ${taskId}: taskId is not a number`);
                    continue;
                }

                const task = await db.getTaskById(taskId.trim());

                if (!task) {
                    errors.push(`Error with taskId = ${taskId}: task not found`);
                } else {
                    tasks.push(task);
                }
            }
        } catch (e) {
            await ctx.reply(getReplyText("error"),
                { parse_mode: "HTML", reply_markup: cancelConversationKeyboard(Conversations.deleteTask) }
            );
            logger().error("Failed to delete task with error: ", e);
            continue;
        }

        if (errors.length) {
            await ctx.reply(getReplyText("invalidDeleteTasks") + "\n\n" + errors.join("\n"), {
                parse_mode: "HTML",
                reply_markup: cancelConversationKeyboard(Conversations.deleteTask)
            });
            continue;
        }

        await ctx.reply(getReplyText("confirmDeleteTask") + "\n\n" + tasks.map((task) => task.taskId + ". " + task.name).join("\n"),
            { parse_mode: "HTML", reply_markup: getConfirmDeleteTaskConvKeyboard() }
        );

        const { callbackQuery } = await conversation.waitFor("callback_query:data");

        if (callbackQuery.data === "confirm_delete_task") {
            for (const task of tasks) {
                await db.deleteTask(task.taskId.toString());
            }
        } else if (callbackQuery.data === "cancel_conv_delete_task") {
            await ctx.reply(getReplyText("deleteTasksCanceled"), {
                parse_mode: "HTML",
            });
            return;
        }

        progress = true;
    } while (!progress);

    await ctx.reply(getReplyText("deleteTasksSuccess"), {
        parse_mode: "HTML",
    });
    return;
}
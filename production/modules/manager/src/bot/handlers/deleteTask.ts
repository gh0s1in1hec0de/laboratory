import { getCancelDeleteTaskConvKeyboard, getConfirmDeleteTaskConvKeyboard, getReplyText } from "../constants";
import type { StoredTasks } from "starton-periphery";
import type { MyContext, MyConversation } from "..";
import { logger } from "../../logger";
import * as db from "../../db";

export async function deleteTask(conversation: MyConversation, ctx: MyContext): Promise<void> {
    await ctx.reply(getReplyText("deleteTaskRequest"),
        { parse_mode: "HTML", reply_markup: getCancelDeleteTaskConvKeyboard() }
    );

    let progress = false;

    do {
        const { msg: { text } } = await conversation.waitFor("message:text");

        const errors: string[] = [];
        const tasks: StoredTasks[] = [];

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
        } catch (error) {
            await ctx.reply(getReplyText("error"),
                { parse_mode: "HTML", reply_markup: getCancelDeleteTaskConvKeyboard() }
            );
            if (error instanceof Error) {
                logger().error("error in db when deleting task", error.message);
            } else {
                logger().error("unknown error");
            }
            continue;
        }

        if (errors.length) {
            await ctx.reply(getReplyText("invalidDeleteTasks") + "\n\n" + errors.join("\n"), {
                parse_mode: "HTML",
                reply_markup: getCancelDeleteTaskConvKeyboard()
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
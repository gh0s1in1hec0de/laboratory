import type { CallbackQueryContext } from "grammy";
import { logger } from "../../logger";
import type { MyContext } from "..";
import * as db from "../../db";
import {
    getTasksPaginationKeyboard,
    getResetTasksKeyboard,
    initTasksSortData,
    getTasksReply,
    getReplyText,
} from "../constants";

async function handleListTasks(
    ctx: CallbackQueryContext<MyContext>,
    sortData: db.StoredTasksRequest,
): Promise<void> {
    try {
        const data = await db.getSortedTasks(sortData.page, sortData.limit);

        if (!data) {
            await ctx.callbackQuery.message!.editText(
                getReplyText("noTasks"),
                { reply_markup: getResetTasksKeyboard() }
            );
            return;
        }

        await ctx.callbackQuery.message!.editText(
            getTasksReply(data.storedTasks),
            { reply_markup: getTasksPaginationKeyboard(data.hasMore, sortData.page) }
        );
    } catch (error) {
        await ctx.callbackQuery.message!.editText(
            getReplyText("error"),
            { reply_markup: getResetTasksKeyboard() }
        );
        if (error instanceof Error) {
            logger().error("error when trying to retrieve a list tasks: ", error.message);
        } else {
            logger().error("unknown error");
        }
    }
}


export async function handleListTasksCallback(ctx: CallbackQueryContext<MyContext>) {
    await ctx.answerCallbackQuery();
    await handleListTasks(ctx, {
        ...initTasksSortData,
        page: ctx.session.tasksPage
    });
}

export async function handleTasksPaginationCallback(ctx: CallbackQueryContext<MyContext>) {
    await ctx.answerCallbackQuery();
    const newPage = ctx.callbackQuery.data == "next_tasks"
        ? ctx.session.tasksPage += 1
        : ctx.callbackQuery.data == "prev_tasks"
            ? ctx.session.tasksPage -= 1
            : ctx.session.tasksPage = 1;
    await handleListTasks(ctx, {
        ...initTasksSortData,
        page: newPage
    });
}

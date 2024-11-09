import type { CallbackQueryContext } from "grammy";
import { logger } from "../../logger";
import type { MyContext } from "..";
import * as db from "../../db";
import {
    getPaginationKeyboard,
    getResetKeyboard,
    initPaginationData,
    getTasksReply,
    ListedObjects,
    getReplyText,
} from "../constants";

async function handleListTasks(
    ctx: CallbackQueryContext<MyContext>,
    sortData: { page: number, limit: number },
): Promise<void> {
    try {
        const data = await db.getSortedTasks(sortData.page, sortData.limit);

        if (!data) {
            await ctx.callbackQuery.message!.editText(
                getReplyText("noTasks"),
                { reply_markup: getResetKeyboard(ListedObjects.Tasks) }
            );
            return;
        }

        await ctx.callbackQuery.message!.editText(
            getTasksReply(data.tasks),
            { reply_markup: getPaginationKeyboard(ListedObjects.Tasks, data.hasMore, sortData.page) }
        );
    } catch (e) {
        await ctx.callbackQuery.message!.editText(
            getReplyText("error"),
            { reply_markup: getResetKeyboard(ListedObjects.Tasks) }
        );
        if (e instanceof Error) logger().error("error when trying to retrieve a list of tasks: ", e);
        else logger().error("unknown error", e);
    }
}


export async function handleListTasksCallback(ctx: CallbackQueryContext<MyContext>) {
    await ctx.answerCallbackQuery();
    await handleListTasks(ctx, {
        ...initPaginationData,
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
        ...initPaginationData,
        page: newPage
    });
}

import type { CallbackQueryContext } from "grammy";
import { logger } from "../../logger";
import type { MyContext } from "..";
import * as db from "../../db";
import {
    getPaginationKeyboard,
    getResetKeyboard,
    initSortingData,
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
            { reply_markup: getPaginationKeyboard(ListedObjects.Tasks,data.hasMore, sortData.page) }
        );
    } catch (error) {
        await ctx.callbackQuery.message!.editText(
            getReplyText("error"),
            { reply_markup: getResetKeyboard(ListedObjects.Tasks) }
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
        ...initSortingData,
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
        ...initSortingData,
        page: newPage
    });
}

import {
    getListLaunchesKeyboard,
    getRetryKeyboard,
    getLaunchesReply, 
    initSortData, 
    getReplyText
} from "../constants";
import type { StoredTokenLaunchRequest } from "../../db";
import { type CallbackQueryContext } from "grammy";
import type { MyContext } from "../index";
import { logger } from "../../logger";
import * as db from "../../db";


async function handleListLaunches(
    ctx: CallbackQueryContext<MyContext>,
    sortData: StoredTokenLaunchRequest,
): Promise<void> {
    try {
        const data = await db.getSortedTokenLaunches(sortData);
    
        if (!data) {
            await ctx.callbackQuery.message!.editText(
                getReplyText("noLaunches"),
                { reply_markup: getRetryKeyboard() }
            );
            return;
        }
      
        await ctx.callbackQuery.message!.editText(
            getLaunchesReply(data.storedTokenLaunch),
            { reply_markup: getListLaunchesKeyboard(data.hasMore, sortData.page) }
        );
    } catch (error) {
        await ctx.callbackQuery.message!.editText(
            getReplyText("error"),
            { reply_markup: getRetryKeyboard() }
        );
        if (error instanceof Error) {
            logger().error("error when trying to retrieve a list launches: ", error.message);
        } else {
            logger().error("unknown error");
        }
    }
}

export async function handleListCallback(ctx: CallbackQueryContext<MyContext>) {
    await ctx.answerCallbackQuery();
    await handleListLaunches(ctx, {
        ...initSortData,
        page: ctx.session.page
    });
}

export async function handlePaginationCallback(ctx: CallbackQueryContext<MyContext>){
    await ctx.answerCallbackQuery();
    const newPage = ctx.callbackQuery.data == "next"
        ? ctx.session.page += 1
        : ctx.callbackQuery.data == "prev"
            ? ctx.session.page -= 1
            : ctx.session.page = 1;
    await handleListLaunches(ctx, {
        ...initSortData,
        page: newPage
    });
}
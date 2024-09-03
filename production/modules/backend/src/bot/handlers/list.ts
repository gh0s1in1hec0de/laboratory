import {
    getErrorReply,
    getListTokenLaunchesKeyboard,
    getNoTokensReply,
    getRetryKeyboard,
    getTokenLaunchesReply
} from "../constants";
import type { StoredTokenLaunchRequest } from "../../db";
import type { CallbackQueryContext } from "grammy";
import type { MyContext } from "../index";
import { logger } from "../../logger";
import * as db from "../../db";


export async function handleListTokensCommand(
    ctx: CallbackQueryContext<MyContext>,
    sortData: StoredTokenLaunchRequest,
): Promise<void> {
    try {
        const data = await db.getSortedTokenLaunches(sortData);
    
        if (!data) {
            await ctx.callbackQuery.message!.editText(
                getNoTokensReply(ctx),
                { reply_markup: getRetryKeyboard() }
            );
            return;
        }
      
        await ctx.callbackQuery.message!.editText(
            getTokenLaunchesReply(data.storedTokenLaunch),
            { reply_markup: getListTokenLaunchesKeyboard(data.hasMore, sortData.page) }
        );
    } catch (error) {
        await ctx.callbackQuery.message!.editText(
            getErrorReply(ctx),
            { reply_markup: getRetryKeyboard() }
        );
        if (error instanceof Error) {
            logger().error(error.message);
        } else {
            logger().error("Unknown error");
        }
    }
}
import type { StoredTokenLaunchRequest } from "../../db";
import { type CallbackQueryContext } from "grammy";
import type { MyContext } from "../index";
import { logger } from "../../logger";
import * as db from "../../db";
import {
    getLaunchesPaginationKeyboard,
    getResetLaunchesKeyboard,
    initLaunchesSortData,
    getLaunchesReply,
    getReplyText,
} from "../constants";

async function handleListLaunches(
    ctx: CallbackQueryContext<MyContext>,
    sortData: StoredTokenLaunchRequest,
): Promise<void> {
    try {
        const launches = await db.getSortedTokenLaunches(sortData);

        if (!launches) {
            await ctx.callbackQuery.message!.editText(
                getReplyText("noLaunches"),
                { reply_markup: getResetLaunchesKeyboard() }
            );
            return;
        }

        await ctx.callbackQuery.message!.editText(
            getLaunchesReply(launches.storedTokenLaunches),
            { reply_markup: getLaunchesPaginationKeyboard(launches.hasMore, sortData.page) }
        );
    } catch (error) {
        await ctx.callbackQuery.message!.editText(
            getReplyText("error"),
            { reply_markup: getResetLaunchesKeyboard() }
        );
        if (error instanceof Error) {
            logger().error("error when trying to retrieve a list launches: ", error.message);
        } else {
            logger().error("unknown error");
        }
    }
}

export async function handleListLaunchesCallback(ctx: CallbackQueryContext<MyContext>) {
    await ctx.answerCallbackQuery();
    await handleListLaunches(ctx, {
        ...initLaunchesSortData,
        page: ctx.session.launchesPage
    });
}

export async function handleLaunchesPaginationCallback(ctx: CallbackQueryContext<MyContext>) {
    await ctx.answerCallbackQuery();
    const newPage = ctx.callbackQuery.data == "next_launches"
        ? ctx.session.launchesPage += 1
        : ctx.callbackQuery.data == "prev_launches"
            ? ctx.session.launchesPage -= 1
            : ctx.session.launchesPage = 1;
    await handleListLaunches(ctx, {
        ...initLaunchesSortData,
        page: newPage
    });
}
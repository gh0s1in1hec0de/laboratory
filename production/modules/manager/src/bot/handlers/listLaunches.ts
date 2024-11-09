import { LaunchSortParameters, SortingOrder } from "starton-periphery";
import { type CallbackQueryContext } from "grammy";
import type { MyContext } from "../index";
import { logger } from "../../logger";
import * as db from "../../db";
import {
    getPaginationKeyboard,
    type PaginationData,
    getResetKeyboard,
    getLaunchesReply,
    initPaginationData,
    ListedObjects,
    getReplyText,
} from "../constants";

async function handleListLaunches(
    ctx: CallbackQueryContext<MyContext>,
    paginationData: PaginationData,
): Promise<void> {
    try {
        const launches = await db.getSortedTokenLaunches({
            ...paginationData,
            orderBy: LaunchSortParameters.CREATED_AT,
            order: SortingOrder.HIGH_TO_LOW,
            search: ""
        });
        if (!launches) {
            await ctx.callbackQuery.message!.editText(
                getReplyText("noLaunches"),
                { reply_markup: getResetKeyboard(ListedObjects.Launches) }
            );
            return;
        }

        await ctx.callbackQuery.message!.editText(
            getLaunchesReply(launches.launchesChunk),
            { reply_markup: getPaginationKeyboard(ListedObjects.Launches, launches.hasMore, paginationData.page) }
        );
    } catch (error) {
        await ctx.callbackQuery.message!.editText(
            getReplyText("error"),
            { reply_markup: getResetKeyboard(ListedObjects.Launches) }
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
        ...initPaginationData,
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
        ...initPaginationData,
        page: newPage
    });
}
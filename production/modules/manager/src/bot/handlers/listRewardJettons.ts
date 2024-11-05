import type { CallbackQueryContext } from "grammy";
import type { MyContext } from "../index";
import { logger } from "../../logger";
import * as db from "../../db";
import {
    getPaginationKeyboard,
    getRewardJettonsReply,
    type PaginationData,
    getResetKeyboard,
    ListedObjects,
    getReplyText,
    initSortingData,
} from "../constants.ts";

async function handleListRewardJettons(
    ctx: CallbackQueryContext<MyContext>,
    sortData: PaginationData,
): Promise<void> {
    try {
        const sortedRewardJettons = await db.getSortedRewardJettons(sortData);
        if (!sortedRewardJettons) {
            await ctx.callbackQuery.message!.editText(
                getReplyText("noRewardJettons"),
                { reply_markup: getResetKeyboard(ListedObjects.RewardJettons) }
            );
            return;
        }

        await ctx.callbackQuery.message!.editText(
            getRewardJettonsReply(sortedRewardJettons.rewardJettons),
            { reply_markup: getPaginationKeyboard(ListedObjects.RewardJettons, sortedRewardJettons.hasMore, sortData.page) }
        );
    } catch (error) {
        await ctx.callbackQuery.message!.editText(
            getReplyText("error"),
            { reply_markup: getResetKeyboard(ListedObjects.RewardJettons) }
        );
        if (error instanceof Error) {
            logger().error("error when trying to retrieve a list launches: ", error.message);
        } else {
            logger().error("unknown error");
        }
    }
}

export async function handleListRewardJettonsCallback(ctx: CallbackQueryContext<MyContext>) {
    await ctx.answerCallbackQuery();
    await handleListRewardJettons(ctx, {
        ...initSortingData,
        page: ctx.session.launchesPage
    });
}

export async function handleRewardJettonsPaginationCallback(ctx: CallbackQueryContext<MyContext>) {
    await ctx.answerCallbackQuery();
    const newPage = ctx.callbackQuery.data == "next_reward_jettons"
        ? ctx.session.launchesPage += 1
        : ctx.callbackQuery.data == "prev_reward_jettons"
            ? ctx.session.launchesPage -= 1
            : ctx.session.launchesPage = 1;
    await handleListRewardJettons(ctx, {
        ...initSortingData,
        page: newPage
    });
}
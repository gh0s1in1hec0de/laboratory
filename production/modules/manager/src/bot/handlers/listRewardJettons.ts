import type { CallbackQueryContext } from "grammy";
import type { ManagerContext } from "../index";
import { logger } from "../../logger";
import * as db from "../../db";
import {
    getPaginationKeyboard,
    getRewardJettonsReply,
    type PaginationData,
    getResetKeyboard,
    initPaginationData,
    ListedObjects,
    getReplyText,
} from "../constants.ts";

async function handleListRewardJettons(
    ctx: CallbackQueryContext<ManagerContext>,
    paginationData: PaginationData,
): Promise<void> {
    try {
        const sortedRewardJettons = await db.getSortedRewardJettons(paginationData);
        if (!sortedRewardJettons) {
            await ctx.callbackQuery.message!.editText(
                getReplyText("noRewardJettons"),
                { reply_markup: getResetKeyboard(ListedObjects.RewardJettons) }
            );
            return;
        }

        await ctx.callbackQuery.message!.editText(
            getRewardJettonsReply(sortedRewardJettons.rewardJettons),
            { reply_markup: getPaginationKeyboard(ListedObjects.RewardJettons, sortedRewardJettons.hasMore, paginationData.page) }
        );
    } catch (e) {
        await ctx.callbackQuery.message!.editText(
            getReplyText("error"),
            { reply_markup: getResetKeyboard(ListedObjects.RewardJettons) }
        );
        if (e instanceof Error) logger().error("error when trying to retrieve a list of reward jettons: ", e);
        else logger().error("unknown error", e);
    }
}

export async function handleListRewardJettonsCallback(ctx: CallbackQueryContext<ManagerContext>) {
    await ctx.answerCallbackQuery();
    await handleListRewardJettons(ctx, {
        ...initPaginationData,
        page: ctx.session.launchesPage
    });
}

export async function handleRewardJettonsPaginationCallback(ctx: CallbackQueryContext<ManagerContext>) {
    await ctx.answerCallbackQuery();
    const newPage = ctx.callbackQuery.data == "next_reward_jettons"
        ? ctx.session.launchesPage += 1
        : ctx.callbackQuery.data == "prev_reward_jettons"
            ? ctx.session.launchesPage -= 1
            : ctx.session.launchesPage = 1;
    await handleListRewardJettons(ctx, {
        ...initPaginationData,
        page: newPage
    });
}
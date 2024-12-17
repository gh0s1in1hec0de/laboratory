import type { CallbackQueryContext } from "grammy";
import type { ManagerContext } from "../index";
import { logger } from "../../logger";
import * as db from "../../db";
import {
    getPaginationKeyboard,
    type PaginationData,
    getRewardPoolsReply,
    initPaginationData,
    getResetKeyboard,
    ListedObjects,
    getReplyText,
} from "../constants.ts";

async function handleListRewardPools(
    ctx: CallbackQueryContext<ManagerContext>,
    paginationData: PaginationData,
): Promise<void> {
    try {
        if (!ctx.session.launchAddress) {
            await ctx.callbackQuery.message!.editText(
                "Session launch address wasn't specified, try to restart conversation",
                { reply_markup: getResetKeyboard(ListedObjects.RewardPools) }
            );
            return;

        }
        const sortedRewardPools = await db.getSortedRewardPools(ctx.session.launchAddress, paginationData);
        if (!sortedRewardPools) {
            await ctx.callbackQuery.message!.editText(
                getReplyText("noRewardPools"),
                { reply_markup: getResetKeyboard(ListedObjects.RewardPools) }
            );
            return;
        }

        await ctx.callbackQuery.message!.editText(
            getRewardPoolsReply(sortedRewardPools.rewardPools),
            { reply_markup: getPaginationKeyboard(ListedObjects.RewardPools, sortedRewardPools.hasMore, paginationData.page) }
        );
    } catch (e) {
        await ctx.callbackQuery.message!.editText(
            getReplyText("error"),
            { reply_markup: getResetKeyboard(ListedObjects.RewardPools) }
        );
        if (e instanceof Error) logger().error("error when trying to retrieve a list reward pools: ", e);
        else logger().error("unknown error", e);
    }
}

export async function handleRewardPoolsPaginationCallback(ctx: CallbackQueryContext<ManagerContext>) {
    await ctx.answerCallbackQuery();
    const newPage = ctx.callbackQuery.data == "next_reward_jettons"
        ? ctx.session.launchesPage += 1
        : ctx.callbackQuery.data == "prev_reward_jettons"
            ? ctx.session.launchesPage -= 1
            : ctx.session.launchesPage = 1;
    await handleListRewardPools(ctx, {
        ...initPaginationData,
        page: newPage,
    });
}
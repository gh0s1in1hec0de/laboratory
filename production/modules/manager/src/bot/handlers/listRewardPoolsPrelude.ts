import type { ManagerContext, MyConversation } from "../index";
import type { RawAddressString } from "starton-periphery";
import { logger } from "../../logger.ts";
import { Address } from "@ton/ton";
import * as db from "../../db";
import {
    cancelConversationKeyboard,
    getPaginationKeyboard,
    getRewardPoolsReply,
    initPaginationData,
    getResetKeyboard,
    Conversations,
    ListedObjects,
    getReplyText
} from "../constants.ts";

export async function listRewardPoolsPrelude(conversation: MyConversation, ctx: ManagerContext): Promise<void> {
    let formattedLaunchAddress: RawAddressString;
    while (true) {
        await ctx.reply("Please provide the launch address to display reward pools for:", {
            reply_markup: cancelConversationKeyboard(Conversations.setRewardPool),
        });

        const { msg: { text: address } } = await conversation.waitFor("message:text");
        try {
            formattedLaunchAddress = Address.parse(address).toRawString();
            if (await db.getTokenLaunch(formattedLaunchAddress)) break;
            await ctx.reply("Launch not found *.*");
        } catch {
            await ctx.reply("Incorrect launch address *.*");
        }
    }

    ctx.session.launchAddress = formattedLaunchAddress;
    try {
        const sortedRewardPools = await db.getSortedRewardPools(formattedLaunchAddress, initPaginationData);
        if (!sortedRewardPools) {
            await ctx.reply(
                getReplyText("noRewardPools"),
                { reply_markup: getResetKeyboard(ListedObjects.RewardPools) }
            );
            return;
        }
        await ctx.reply(
            getRewardPoolsReply(sortedRewardPools.rewardPools),
            { reply_markup: getPaginationKeyboard(ListedObjects.RewardPools, sortedRewardPools.hasMore, initPaginationData.page) }
        );
    } catch (e) {
        await ctx.reply(getReplyText("error"));
        if (e instanceof Error) logger().error("error when trying to retrieve a list reward pools: ", e);
        else logger().error("unknown error", e);
        return;
    }
}
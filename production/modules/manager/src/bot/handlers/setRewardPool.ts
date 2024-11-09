import { formatLink, jettonFromNano, type RawAddressString } from "starton-periphery";
import { cancelConversationKeyboard, Conversations } from "../constants";
import type { MyContext, MyConversation } from "../index";
import { Address } from "@ton/ton";
import * as db from "../../db";

export async function setRewardPool(conversation: MyConversation, ctx: MyContext): Promise<void> {
    await ctx.reply(
        "Please provide the launch and reward jetton addresses in this format: launch_address | reward_jetton_address",
        { reply_markup: cancelConversationKeyboard(Conversations.setRewardPool) }
    );
    const { msg: { text: addresses } } = await conversation.waitFor("message:text");
    const [launchAddress, rewardJettonAddress] = addresses.split(" | ").map(item => item.trim());

    if (!launchAddress || !rewardJettonAddress) {
        await ctx.reply("Invalid format. Please make sure to separate the two addresses with ' | '.");
        return;
    }

    let formattedLaunchAddress: RawAddressString | null = null;
    let formattedRewardJettonAddress: RawAddressString | null = null;
    // Yup it's pretty bloated, but isAddress() check works like shit
    try {
        formattedLaunchAddress = Address.parse(launchAddress).toRawString();
    } catch (e) {
        await ctx.reply("Incorrect launch address *.*");
        return;
    }
    try {
        formattedRewardJettonAddress = Address.parse(rewardJettonAddress).toRawString();
    } catch (e) {
        await ctx.reply("Incorrect reward jetton address address *.*");
        return;
    }

    const [launch, rewardJetton] = await Promise.all([
        db.getTokenLaunch(formattedLaunchAddress),
        db.getRewardJetton(formattedRewardJettonAddress)
    ]);
    if (!launch || !rewardJetton) {
        const missingParts = [
            !launch ? "launch" : null,
            !rewardJetton ? "reward jetton" : null
        ].filter(Boolean).join(" and ");

        await ctx.reply(`${missingParts} not found.`);
        return;
    }
    if (launch.timings.publicRoundEndTime < Math.floor(Date.now() / 1000) + 10) {
        await ctx.reply("Launch has been ended");
        return;
    }

    const { currentBalance, lockedForRewards, isActive } = rewardJetton;
    const { name, symbol, description, image, decimals } = rewardJetton.metadata;
    const freeToUse = currentBalance - lockedForRewards;
    const message =
        "Reward jetton:\n" +
        (name ? `- name: ${name}\n` : "") +
        (symbol ? `- symbol: ${symbol}\n` : "") +
        (description ? `- description: ${description}\n` : "") +
        (isActive ? "- is active" : "is not active") +
        "\n" +
        `- current dispenser balance: ${jettonFromNano(currentBalance, Number(decimals ?? 6))} (raw ${currentBalance})\n` +
        `- locked for rewards: ${jettonFromNano(lockedForRewards, Number(decimals ?? 6))} (raw ${lockedForRewards})\n` +
        `- free to use: ${jettonFromNano(freeToUse, Number(decimals ?? 6))} (raw ${freeToUse})\n` +
        "please enter reward amount (less than `free to use`) for pool in raw format and make sure you're feeling all right\n" +
        "P.S. if you set 0 - pool will be deleted";

    if (image) await ctx.replyWithPhoto(
        formatLink(image),
        { caption: message, reply_markup: cancelConversationKeyboard(Conversations.setRewardPool) }
    );
    else await ctx.reply(message, { reply_markup: cancelConversationKeyboard(Conversations.setRewardPool) });

    const { msg: { text: rewardAmountStringified } } = await conversation.waitFor("message:text");
    const rewardAmount = BigInt(rewardAmountStringified);
    console.log(rewardAmount, rewardAmount === 0n);

    if (rewardAmount > freeToUse) {
        await ctx.reply("Are you dumb? I said less than free to use, ok, now do everything again");
        return;
    }

    try {
        await db.upsertRewardPool({
            tokenLaunch: formattedLaunchAddress,
            rewardJetton: formattedRewardJettonAddress,
            rewardAmount
        });
        await ctx.reply("Done! have a nice day^^");
    } catch (e) {
        await ctx.reply(`Failed to store new data with error ${e}`);
    }
}
import { formatLink, jettonFromNano, type JettonMetadata, parseJettonMetadata } from "starton-periphery";
import { Conversations, cancelConversationKeyboard } from "../constants";
import { Address, JettonMaster, JettonWallet } from "@ton/ton";
import type { MyContext, MyConversation } from "..";
import { balancedTonClient } from "../../client";
import { getConfig } from "../../config";
import * as db from "../../db";

export async function setRewardJetton(conversation: MyConversation, ctx: MyContext): Promise<void> {
    try {
        await ctx.reply(
            "Please provide the address of the jetton you wish to add^^",
            { reply_markup: cancelConversationKeyboard(Conversations.setRewardJetton) }
        );
        const { msg: { text: jettonAddress } } = await conversation.waitFor("message:text");

        let jettonAddressParsed: Address | null = null;
        try {
            jettonAddressParsed = Address.parse(jettonAddress);
        } catch (e) {
            await ctx.reply("Incorrect jetton address *.*");
            return;
        }

        const jettonContract = await balancedTonClient.execute(c =>
            c.open(JettonMaster.create(jettonAddressParsed))
        );
        let metadata: JettonMetadata | null = null;
        try {
            const runStack = (await balancedTonClient.execute(c => c.runMethod(jettonContract.address, "get_jetton_data"), true)).stack;
            runStack.skip(3);
            const content = runStack.readCell();
            metadata = await parseJettonMetadata(content);
        } catch (e) {
            await ctx.reply(`Failed to parse jetton metadata with error: ${e}`);
        }
        const ourWalletAddress = await balancedTonClient.execute(() =>
            jettonContract.getWalletAddress(Address.parse(getConfig().ton.dispenser_wallet_address))
        );


        const ourWallet = await balancedTonClient.execute(c =>
            c.open(JettonWallet.create(ourWalletAddress))
        );
        const currentBalance = await balancedTonClient.execute(() => ourWallet.getBalance());

        if (!currentBalance) {
            await ctx.reply(`Jettons on the wallet ${ourWalletAddress} not found`);
            return;
        }
        const maybeExistingRecord = await db.getRewardJetton(jettonAddressParsed.toRawString());
        let existingJettonData: string | null = null;
        if (maybeExistingRecord) {
            const decimals = Number(maybeExistingRecord.metadata.decimals ?? "6");
            existingJettonData = "reward pool already exists, current data:\n" +
                `locked for rewards: ${jettonFromNano(maybeExistingRecord.lockedForRewards, decimals)} (raw ${maybeExistingRecord.lockedForRewards})\n` +
                `dispenser thinks he has: ${jettonFromNano(maybeExistingRecord.currentBalance, decimals)} (raw ${maybeExistingRecord.currentBalance})\n` +
                `pool is ${maybeExistingRecord.isActive ? "" : "not "}active\n` +
                `reward per launch is ${(jettonFromNano(maybeExistingRecord.rewardAmount, decimals))}, (raw ${maybeExistingRecord.rewardAmount})\n` +
                (currentBalance > maybeExistingRecord.currentBalance ? "the real balance is less than the accounted balance, please contact gh0s1in1hec0de" : "") +
                "\n";
        }

        const message =
            (!metadata
                ? "Failed to parse jetton metadata.\n"
                : "Jetton:\n" +
                (metadata.name ? `- name: ${metadata.name}\n` : "") +
                (metadata.symbol ? `- symbol: ${metadata.symbol}\n` : "") +
                (metadata.description ? `- description: ${metadata.description}\n` : "")) +
            `- current wallet balance: ${jettonFromNano(currentBalance, Number(metadata?.decimals || 0))} (raw ${currentBalance})\n` +
            "\n" +
            (existingJettonData ? existingJettonData : "") +
            "please enter reward amount (raw) and make sure you're feeling all right\n";

        if (metadata?.image) await ctx.replyWithPhoto(formatLink(metadata?.image), {
            caption: message,
            reply_markup: cancelConversationKeyboard(Conversations.setRewardJetton),
        });
        else await ctx.reply(message, { reply_markup: cancelConversationKeyboard(Conversations.setRewardJetton) });

        if (maybeExistingRecord && maybeExistingRecord.lockedForRewards > currentBalance) {
            await ctx.reply(`emergency case: locked for rewards (${maybeExistingRecord.lockedForRewards}) > current balance (${currentBalance}), terminating`);
            return;
        }
        const { msg: { text: rewardAmount } } = await conversation.waitFor("message:text");

        let isActive: boolean;
        while (true) {
            await ctx.reply("Activate pool? (yes/no)", {
                reply_markup: cancelConversationKeyboard(Conversations.setRewardJetton),
            });
            const { msg: { text: activationResponse } } = await conversation.waitFor("message:text");
            if (activationResponse !== "yes" && activationResponse !== "no") continue;
            isActive = activationResponse === "yes";
            break;
        }

        try {
            await db.upsertRewardJetton({
                masterAddress: jettonAddressParsed.toRawString(),
                ourWalletAddress: ourWalletAddress.toRawString(),
                metadata: metadata ?? {},
                currentBalance,
                rewardAmount: BigInt(rewardAmount),
                isActive
            });
            await ctx.reply("Done! have a nice day^^");
        } catch (e) {
            await ctx.reply(`Failed to store new data with error ${e}`);
        }
    } catch (e) {
        console.error("Error when adding reward jetton: ");
        console.error(e);
        throw e;
    }
}

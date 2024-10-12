import { formatLink, jettonFromNano, parseJettonMetadata } from "starton-periphery";
import { Address, JettonMaster, JettonWallet } from "@ton/ton";
import type { MyContext, MyConversation } from "..";
import { balancedTonClient } from "../../client";
import { getConfig } from "../../config";
import * as db from "../../db";


export async function addRewardJetton(conversation: MyConversation, ctx: MyContext): Promise<void> {
    await ctx.reply("Please provide the address of the jetton you wish to add to rewards");
    const { msg: { text: jettonAddress } } = await conversation.waitFor("message:text");

    let jettonAddressParsed: Address | null = null;
    try {
        jettonAddressParsed = Address.parse(jettonAddress);
    } catch (e) {
        await ctx.reply("Incorrect jetton address");
        return;
    }

    const jettonContract = await balancedTonClient.execute(c =>
        c.open(JettonMaster.create(jettonAddressParsed))
    );
    const { content } = await balancedTonClient.execute(() => jettonContract.getJettonData());
    const metadata = await parseJettonMetadata(content);
    const ourWalletAddress = await balancedTonClient.execute(() =>
        jettonContract.getWalletAddress(
            Address.parse(getConfig().ton.dispenser_wallet_address)
        )
    );
    const ourWallet = await balancedTonClient.execute(c =>
        c.open(JettonWallet.create(ourWalletAddress))
    );
    const currentBalance = await balancedTonClient.execute(() => ourWallet.getBalance());

    if (!currentBalance) {
        await ctx.reply(`Jettons on the wallet ${ourWalletAddress} not found`);
        return;
    }

    const { name, symbol, description, image, decimals } = metadata;
    const message = `
Jetton:
${name ? `- Name: ${name}` : ""}
${symbol ? `- Symbol: ${symbol}` : ""}
${description ? `- Description: ${description}` : ""}

Current balance: ${jettonFromNano(currentBalance, Number(decimals))} (raw ${currentBalance})

Please enter reward amount (raw) and make sure you're feeling all right.
    `;

    if (image) await ctx.replyWithPhoto(formatLink(image), { caption: message });
    else await ctx.reply(message);

    const { msg: { text: rewardAmount } } = await conversation.waitFor("message:text");
    try {
        if (await db.getRewardJetton(jettonAddressParsed.toRawString())) {
            await db.updateRewardJettonNumbers(jettonAddressParsed.toRawString(), currentBalance, BigInt(rewardAmount));
        } else {
            await db.storeRewardJetton({
                masterAddress: jettonAddressParsed.toRawString(),
                ourWalletAddress: ourWalletAddress.toRawString(),
                metadata,
                currentBalance,
                rewardAmount: BigInt(rewardAmount)
            });
        }
    } catch (e) {
        await ctx.reply(`Failed to store new data with error ${e}`);
    }
    await ctx.reply("Done!");
}

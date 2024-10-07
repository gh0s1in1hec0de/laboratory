import type { MyContext, MyConversation } from "..";
import { getReplyText } from "../constants";
import { logger } from "../../logger";
import { Address, JettonMaster, TonClient } from "@ton/ton";
import { getConfig } from "../../config.ts";
import { type JettonMetadata, parseJettonMetadata } from "starton-periphery";

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

    const client = new TonClient({
        endpoint: `https://${getConfig().ton_api.network === "testnet" ? "testnet." : ""}toncenter.com/api/v2/jsonRPC`,
        apiKey: getConfig().ton_api.keys.testnet
    });
    const jettonContract = client.open(
        JettonMaster.create(jettonAddressParsed)
    );
    const { content } = await jettonContract.getJettonData();
    const parsedMetadata: JettonMetadata = await parseJettonMetadata(content);

    await ctx.reply("Jetton data: ...\nCurrent balance: ...\nPlease enter a number less than the balance.");

    const { msg: { text: amountText } } = await conversation.waitFor("message:text");
    const amount = parseFloat(amountText);

    // TODO: Implement your logic here
    const success = true; // Replace with actual logic

    if (success) {
        await ctx.reply("Success! The operation was completed.");
    } else {
        await ctx.reply("Error! Something went wrong.");
    }
}
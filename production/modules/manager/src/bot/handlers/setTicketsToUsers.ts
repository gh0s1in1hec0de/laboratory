import { cancelConversationKeyboard, Conversations, getReplyText } from "../constants";
import type { MyContext, MyConversation } from "..";
import { validateUserAddresses } from "./common";
import { logger } from "../../logger";
import { Address } from "@ton/core";
import * as db from "../../db";

export async function setTicketsToUsers(conversation: MyConversation, ctx: MyContext): Promise<void> {
    await ctx.reply(
        getReplyText("setTicketsToUsers"),
        { parse_mode: "HTML", reply_markup: cancelConversationKeyboard(Conversations.setTicketsToUsers) }
    );

    let progress = false;
    do {
        const { msg: { text } } = await conversation.waitFor("message:text");
        const { validAddresses, errors } = validateUserAddresses(text);

        if (errors.length) {
            await ctx.reply(getReplyText("invalidSetTicketsToUsers") + "\n" + errors.join("\n"), {
                parse_mode: "HTML",
                reply_markup: cancelConversationKeyboard(Conversations.setTicketsToUsers)
            });
            continue;
        }

        try {
            for (const userAddress of validAddresses) {
                await db.incrementUserTickets(Address.parse(userAddress).toRawString());
            }
        } catch (error) {
            await ctx.reply(getReplyText("error"),
                { parse_mode: "HTML", reply_markup: cancelConversationKeyboard(Conversations.setTicketsToUsers) }
            );
            logger().error("Failed to increment tickets for users with an error: ", error);
            continue;
        }

        progress = true;
    } while (!progress);

    await ctx.reply(getReplyText("addTicketsSuccess"), { parse_mode: "HTML", });
}
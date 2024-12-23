import { cancelConversationKeyboard, Conversations, getReplyText } from "../constants";
import type { ManagerContext, MyConversation } from "..";
import { isReadyUsersTasksToDb } from "./common";
import { logger } from "../../logger";
import { Address } from "@ton/core";
import * as db from "../../db";

export async function setTasksCompletions(conversation: MyConversation, ctx: ManagerContext): Promise<void> {
    await ctx.reply(
        getReplyText("addressListRequest"),
        { parse_mode: "HTML", reply_markup: cancelConversationKeyboard(Conversations.setTasksCompletions) }
    );

    let progress = false;
    do {
        const { msg: { text } } = await conversation.waitFor("message:text");
        const { validMap, errors } = isReadyUsersTasksToDb(text);

        if (errors.length) {
            await ctx.reply(getReplyText("invalidAddUsersTasksRelations") + "\n" + errors.join("\n"), {
                parse_mode: "HTML",
                reply_markup: cancelConversationKeyboard(Conversations.setTasksCompletions)
            });
            continue;
        }

        try {
            for (const [userAddress, taskIds] of validMap) {
                for (const taskId of taskIds) {
                    await db.storeUserTaskRelations(Address.parse(userAddress).toRawString(), taskId);
                }
            }
        } catch (error) {
            await ctx.reply(getReplyText("error"),
                { parse_mode: "HTML", reply_markup: cancelConversationKeyboard(Conversations.setTasksCompletions) }
            );
            logger().error("Failed to add new task relations with an error: ", error);
            continue;
        }

        progress = true;
    } while (!progress);

    await ctx.reply(getReplyText("addWalletsSuccess"), { parse_mode: "HTML", });
}
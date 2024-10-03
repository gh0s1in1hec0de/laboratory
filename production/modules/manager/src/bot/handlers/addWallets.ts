import { Address } from "@ton/core";
import type { MyContext, MyConversation } from "..";
import * as db from "../../db";
import { logger } from "../../logger";
import { getCancelConversationKeyboard, getReplyText } from "../constants";
import { isReadyUsersTasksToDb } from "./common";

export async function addWalletsToRelations(conversation: MyConversation, ctx: MyContext): Promise<void> {
    await ctx.reply(getReplyText("addressListRequest"),
        { parse_mode: "HTML", reply_markup: getCancelConversationKeyboard() }
    );

    let progress = false;
    do {
        const { msg: { text } } = await conversation.waitFor("message:text");
        const res = isReadyUsersTasksToDb(text);
        if (!res) {
            await ctx.reply(getReplyText("invalidAddUsersTasksRelations"), {
                parse_mode: "HTML",
                reply_markup: getCancelConversationKeyboard()
            });
            continue;
        }

        try {
            for (const [userAddress, taskIds] of res) {
                for (const taskId of taskIds) {
                    await db.storeUserTaskRelations(Address.parse(userAddress).toRawString(), taskId);
                }
            }
        } catch (error) {
            await ctx.reply(getReplyText("error"),
                { parse_mode: "HTML", reply_markup: getCancelConversationKeyboard() }
            );
            if (error instanceof Error) {
                logger().error("error in db when adding to table 'UserTaskRelation'", error.message);
            } else {
                logger().error("unknown error");
            }
            continue;
        }

        progress = true;
    } while (!progress);

    await ctx.reply(getReplyText("addWalletsSuccess"));
    return;
}
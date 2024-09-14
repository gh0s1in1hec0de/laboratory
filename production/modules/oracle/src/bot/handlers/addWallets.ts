import { getCancelConversationKeyboard, getMenuKeyboard, getReplyText } from "../constants";
import { isReadyUsersTasksToDb } from "./common";
import type { MyContext, MyConversation } from "..";
import type { CallbackQueryContext } from "grammy";
import { logger } from "../../logger";
import * as db from "../../db";

export async function addWalletsToRelations(conversation: MyConversation, ctx: MyContext): Promise<void> {
    /**
     * LEGACY
     */
    // await ctx.reply(getReplyText("idRequest"),
    //     { parse_mode: "HTML", reply_markup: getCancelConversationKeyboard() }
    // );
    //
    // let res;
    //
    // do {
    //     const { msg: { text } } = await conversation.waitFor("message:text");
    //
    //     if (isNaN(Number(text))) {
    //         await ctx.reply(getReplyText("invalidId"),
    //             { parse_mode: "HTML", reply_markup: getCancelConversationKeyboard() }
    //         );
    //         continue;
    //     }
    //
    //     res = await db.getTokenLaunchById(text);
    //
    //     if (!res) await ctx.reply(getReplyText("invalidId"),
    //         { parse_mode: "HTML", reply_markup: getCancelConversationKeyboard() }
    //     );
    // } while (!res);
  
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
                    await db.storeUserTaskRelations(userAddress, taskId);
                }
            }
        } catch (error) {
            await ctx.reply(getReplyText("error"),
                { parse_mode: "HTML", reply_markup: getCancelConversationKeyboard() }
            );
            if (error instanceof Error) {
                logger().error("error in db when adding to table 'UserTaskRelation'",error.message);
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
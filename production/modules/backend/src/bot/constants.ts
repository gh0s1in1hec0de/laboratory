import { type CommandContext, Keyboard } from "grammy";
import type { MyContext } from "./index.ts";
import { getConfig } from "../config.ts";

/**
 * REPLY
 */
export function getStartReply(ctx: CommandContext<MyContext>): string {
    return ctx.emoji`<b>Hello, it\`s Starton ${"rocket"}</b>\n\nWhat are we gonna do?`;
}

export async function getUnknownMsgReply(ctx: MyContext) {
    await ctx.reply(ctx.emoji`I don't understand the language of primitive people ${"monkey_face"}`);
}


/**
 * KEYBOARDS
 */
export function getStartKeyboard(ctx: CommandContext<MyContext>): Keyboard {
    const { emoji } = ctx;
    return new Keyboard()
        .text(emoji`View a list of token launches ${"spiral_notepad"}`)
        .text(emoji`Add wallets to whitelist ${"check_mark_button"}`)
        .resized();
}


/**
 * FILTERS
 */
export async function getAdminFilter(ctx: MyContext): Promise<boolean> {
    const {
        bot: {
            admins
        }
    } = getConfig();
    
    if (!admins.includes(ctx.from!.id)) {
        await ctx.reply("U are not an admin.");
        await ctx.stopPoll();
        return false;
    }
    
    return true;
}
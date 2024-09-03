import { type CallbackQueryContext, type CommandContext, type HearsContext, InlineKeyboard } from "grammy";
import type { StoredTokenLaunch } from "../db";
import { getConfig } from "../config.ts";
import type { MyContext } from "./index";

/**
 * COMMON
 */
interface ICommand {
  command: string,
  description: string,
}

export const commands: ICommand[] = [
    { command: "start", description: "start the bot" },
    { command: "menu", description: "go to hell" }
];

export enum Emoji {
  Wallet = "purse",
  File = "open_file_folder",
  Skull = "skull_and_crossbones"
}


/**
 * REPLY
 */
export function getStartReply(ctx: CommandContext<MyContext>): string {
    return ctx.emoji`
<b>Hello, it\`s Starton ${Emoji.Skull}</b>\n
Click on \/menu to go to hell`;
}

export function getMenuReply(ctx: CommandContext<MyContext> | CallbackQueryContext<MyContext>): string {
    return ctx.emoji`
What are we gonna do?\n
1. View a list of <b>token launches</b> ${Emoji.File}
2. Add wallets to <b>whitelist</b> ${Emoji.Wallet}`;
}

export function getNoTokensReply(ctx: CommandContext<MyContext> | CallbackQueryContext<MyContext>): string {
    return ctx.emoji`
No token Launches ${"alien_monster"}`;
}

export function getErrorReply(ctx: CommandContext<MyContext> | CallbackQueryContext<MyContext>): string {
    return ctx.emoji`
I have some error. Try later ${"angry_face"}`;
}

export function getTokenLaunchesReply(storedTokenLaunch: StoredTokenLaunch[]): string {
    return storedTokenLaunch.map((tokenLaunch, index) => {
        const { name, address, createdAt } = tokenLaunch;
        const formattedDate = new Intl.DateTimeFormat("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(new Date(createdAt));
    
        return `${index + 1}. ${name} - ${formattedDate} - ${address}`;
    }).join("\n");
}

export async function getUnknownMsgReply(ctx: MyContext) {
    await ctx.reply(ctx.emoji`I don't understand the language of people ${"monkey_face"}`);
}


/**
 * KEYBOARDS
 */
export function getMenuKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("1", "list")
        .text("2", "add");
}

export function getListTokenLaunchesKeyboard(hasMore: boolean, page: number): InlineKeyboard {
    const keyboard = new InlineKeyboard();
  
    page > 1 ? keyboard.text("« prev", "prev") : keyboard.text(".", "nothing");
    keyboard.text("· stay ·", "stay");
    hasMore ? keyboard.text("next »", "next").row() : keyboard.text(".", "nothing").row();
  
    return keyboard.text("< back to menu", "back");
}

export function getRetryKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("Update", "update");
}


/**
 * FILTERS
 */
export async function getAdminFilter(ctx: MyContext | HearsContext<MyContext>): Promise<boolean> {
    const {
        bot: {
            admins
        }
    } = getConfig();
    
    if (!admins.includes(ctx.from!.id)) {
        await ctx.reply("Fuck off, you are not an admin...");
        await ctx.stopPoll();
        return false;
    }
    
    return true;
}
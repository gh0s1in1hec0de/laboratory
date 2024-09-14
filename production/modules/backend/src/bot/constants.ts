import { Address } from "@ton/ton";
import type { StoredTokenLaunch, StoredTokenLaunchRequest } from "../db";
import { SortOrder, TokenLaunchFields } from "starton-periphery";
import { type HearsContext, InlineKeyboard } from "grammy";
import type { MyContext } from "./index";
import { getConfig } from "../config";

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

export const initSortData: StoredTokenLaunchRequest = {
    page: 1,
    limit: 10,
    orderBy: TokenLaunchFields.CREATED_AT,
    order: SortOrder.ASC,
    search: ""
};

// ٩(ఠ益ఠ)۶
// 〜(＞_＜)〜
// ╮(￣_￣)╭
// ＼(￣o￣)／
// (￣ヘ￣)
// (⊙_⊙)
// (￣▽￣)ノ

/**
 * REPLY
 */
const replies = {
    start: "<b>Hello, I'm Starton!</b> (￣▽￣)ノ\nClick /menu to get started",
    menu: "<b>What would you like to do?</b> ＼(￣o￣)／",
    noLaunches: "Sorry, there are no token launches available at the moment (￣ヘ￣)",
    error: "Oops! An error occurred. Please try again later 〜(＞_＜)〜",
    idRequest: "Please send me the <b>ID</b> of the token launch (⊙_⊙)",
    invalidId: "Oops! That's an invalid <b>ID</b> (￣ヘ￣). Please try again...",
    addressList: "Please send me the <b>User Address</b> and <b>Task ID</b> (￣▽￣)ノ\nExample: <code>userAddr1|taskID1, userAddr2|taskID2</code>",
    invalidAddresses: "Oops! That's invalid <b>data</b> (￣ヘ￣). Please try again...",
    unknown: "Sorry, I didn't understand that ╮(￣_￣)╭",
    addWalletsSuccess: "Great! Wallets have been successfully added! ＼(￣▽￣)／"
};
export function getReplyText(key: keyof typeof replies): string {
    return replies[key];
}

export function getLaunchesReply(storedTokenLaunch: StoredTokenLaunch[]): string {
    return storedTokenLaunch.map((tokenLaunch) => {
        const { identifier, id, createdAt } = tokenLaunch;
        const formattedDate = new Intl.DateTimeFormat("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).format(new Date(createdAt));
    
        return `${id}. ${identifier} - ${formattedDate}`;
    }).join("\n");
}

export async function getUnknownMsgReply(ctx: MyContext) {
    await ctx.reply(getReplyText("unknown"));
}


/**
 * KEYBOARDS
 */
export function getMenuKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("list of token launches", "list_launches").row()
        .text("wallets to whitelist", "add_wallets");
}

export function getListLaunchesKeyboard(hasMore: boolean, page: number): InlineKeyboard {
    const keyboard = new InlineKeyboard();
  
    page > 1 ? keyboard.text("< prev", "prev") : keyboard.text(".", "nothing");
    keyboard.text(`· ${page} ·`, "nothing");
    hasMore ? keyboard.text("next >", "next").row() : keyboard.text(".", "nothing").row();
  
    return keyboard.text("« back to menu", "back");
}

export function getRetryKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("reset", "reset_list").row()
        .text("< back to menu", "back");
}

export function getCancelConversationKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("cancel", "cancel_conv").row();
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
        await ctx.reply("(⊙_⊙) Fuck off, you are not an admin...");
        await ctx.stopPoll();
        return false;
    }

    return true;
}


/**
 * UTILS
 */
const map: Map<string, string[]> = new Map();

export function isValidString(str: string): Map<string, string[]> | null {
    map.clear();
    const pairs = str.split(",");

    for (const pair of pairs) {
        const [userAddress, taskId] = pair.split("|");
        
        if (!userAddress?.trim() || !taskId?.trim()) return null;
        // || Address.isAddress(userAddress.trim())
        
        const trimmedAddress = userAddress.trim();
        const trimmedId = taskId.trim();
        
        if (map.has(trimmedAddress)) {
            map.get(trimmedAddress)?.push(trimmedId);
        } else {
            map.set(trimmedAddress, [trimmedId]);
        }
    }
  
    return map;
}
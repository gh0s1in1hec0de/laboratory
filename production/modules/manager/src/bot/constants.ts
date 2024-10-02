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

export enum Conversations {
    addWallets = "addWalletsToRelations",
    createTask = "createTask",
}

// ٩(ఠ益ఠ)۶
// 〜(＞_＜)〜
// ╮(￣_￣)╭
// ＼(￣o￣)／
// (￣ヘ￣)
// (￣▽￣)ノ

/**
 * REPLY
 */
const replies = {
    start: "<b>Hello, it`s Starton</b> (￣▽￣)ノ\nClick on /menu to go to hell",
    menu: "<b>What are we gonna do?</b> ＼(￣o￣)／",
    noLaunches: "I don`t have token launches (￣ヘ￣)",
    error: "I got an error. Try later 〜(＞_＜)〜",
    idRequest: "Send me <b>ID</b> of token launch (⊙_⊙)",
    invalidId: "Invalid <b>ID</b> (￣ヘ￣). Try again dumbass...",
    addressListRequest: "Send me <b>User Address</b> and <b>Task ID</b> (￣▽￣)ノ\n\nExample: <code>userAdr1|taskID1, userAdr2|taskID2</code>",
    invalidAddUsersTasksRelations: "Invalid <b>data</b> (￣ヘ￣). Try again dumbass...",
    unknown: "I don't understand the language of people ╮(￣_￣)╭",
    addWalletsSuccess: "Nice! Wallets successfully added! ＼(￣▽￣)／",
    createTaskRequest: "Let's create a task together!\nWhat will the task consist of? ╮(￣_￣)╭\n\nExample:\n<code>taskName1$rewardTickets|subtaskName1&subtaskDescription1\ntaskName2$rewardTickets|subtaskName2&subtaskDescription2</code>",
    invalidAddTasks: "Invalid <b>data</b> (￣ヘ￣). Try again dumbass...",
    addTasksSuccess: "Nice! Tasks successfully added! ＼(￣▽￣)／",
};
export function getReplyText(key: keyof typeof replies): string {
    return replies[key];
}

export function getLaunchesReply(storedTokenLaunch: StoredTokenLaunch[]): string {
    return storedTokenLaunch.map((tokenLaunch) => {
        const { identifier, id, createdAt } = tokenLaunch;
        const date = new Date(Number(createdAt) * 1000);

        const formattedDate = date.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

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
        .text("list of token launches", "list_launches")
        .text("wallets complete task", "add_wallets").row()
        .text("add tasks", "add_task");
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
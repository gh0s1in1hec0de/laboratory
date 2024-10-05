import type { StoredTasks, StoredTasksRequest, StoredTokenLaunch, StoredTokenLaunchRequest } from "../db";
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

export const initLaunchesSortData: StoredTokenLaunchRequest = {
    page: 1,
    limit: 10,
    orderBy: TokenLaunchFields.CREATED_AT,
    order: SortOrder.ASC,
    search: ""
};

export const initTasksSortData: StoredTasksRequest = {
    page: 1,
    limit: 10,
};

export enum Conversations {
    addWallets = "addWalletsToRelations",
    createTask = "createTask",
    deleteTask = "deleteTask",
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
    invalidId: "Invalid <b>ID</b> (￣ヘ￣).",
    addressListRequest: "Send me <b>User Address</b> and <b>Task ID</b> (￣▽￣)ノ\n\nExample: <code>userAdr1|taskID1, userAdr2|taskID2</code>",
    invalidAddUsersTasksRelations: "Invalid <b>data</b> (￣ヘ￣).",
    unknown: "I don't understand the language of people ╮(￣_￣)╭",
    addWalletsSuccess: "Nice! Wallets successfully added! ＼(￣▽￣)／\n\n<b>Want continue?</b> Click on /menu",
    createTaskRequest: "Let's create a task together!\nWhat will the task consist of? ╮(￣_￣)╭\n\n<b>Example:</b>\n<code>taskName1|subtaskName1&subtaskDescription1\ntaskName2|subtaskName2&subtaskDescription2</code>",
    invalidAddTasks: "Invalid <b>data</b> (￣ヘ￣).",
    addTasksSuccess: "Nice! Tasks successfully added! ＼(￣▽￣)／\n\n<b>Want continue?</b> Click on /menu.",
    noTasks: "I don`t have tasks (￣ヘ￣)",
    deleteTaskRequest: "Send me <b>Task ID</b> (￣▽￣)ノ\n\nExample: <code>taskID1, taskID2</code>",
    deleteTasksSuccess: "Nice! Tasks successfully deleted! ＼(￣▽￣)／\n\n<b>Want continue?</b> Click on /menu.",
    confirmDeleteTask: "Are you sure you want to delete this tasks? ٩(ఠ益ఠ)۶",
    deleteTasksCanceled: "Deleting tasks successfully canceled ＼(￣▽￣)／\n\n<b>Want continue?</b> Click on /menu",
    invalidDeleteTasks: "Invalid <b>data</b> (￣ヘ￣).",
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

export function getTasksReply(storedTasks: StoredTasks[]): string {
    const oneWeekInSeconds = 7 * 24 * 60 * 60;
    const currentTime = Math.floor(Date.now() / 1000);
    
    return storedTasks.map((task) => {
        const { taskId, name, createdAt } = task;
        const date = new Date(Number(createdAt) * 1000);

        const formattedDate = date.toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

        const status = (currentTime - Number(createdAt)) > oneWeekInSeconds ? "staged" : "not staged";

        return `${taskId}. ${name} - ${formattedDate} - (${status})`;
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
        .text("get token launches", "list_launches").row()
        .text("users complete tasks", "add_wallets").row()
        .text("get tasks", "list_tasks").row()
        .text("create tasks", "create_task")
        .text("delete tasks", "delete_task");
}

export function getLaunchesPaginationKeyboard(hasMore: boolean, page: number): InlineKeyboard {
    const keyboard = new InlineKeyboard();
  
    page > 1 ? keyboard.text("< prev", "prev_launches") : keyboard.text(".", "nothing");
    keyboard.text(`· ${page} ·`, "nothing");
    hasMore ? keyboard.text("next >", "next_launches").row() : keyboard.text(".", "nothing").row();
  
    return keyboard.text("« back to menu", "back");
}

export function getTasksPaginationKeyboard(hasMore: boolean, page: number): InlineKeyboard {
    const keyboard = new InlineKeyboard();
  
    page > 1 ? keyboard.text("< prev", "prev_tasks") : keyboard.text(".", "nothing");
    keyboard.text(`· ${page} ·`, "nothing");
    hasMore ? keyboard.text("next >", "next_tasks").row() : keyboard.text(".", "nothing").row();
  
    return keyboard.text("« back to menu", "back");
}

export function getResetLaunchesKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("reset", "reset_launches").row()
        .text("< back to menu", "back");
}

export function getResetTasksKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("reset", "reset_tasks").row()
        .text("< back to menu", "back");
}

export function getCancelAddWalletsConvKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("cancel", "cancel_conv_add_wallets").row();
}

export function getCancelCreateTaskConvKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("cancel", "cancel_conv_create_task").row();
}

export function getCancelDeleteTaskConvKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("cancel", "cancel_conv_delete_task").row();
}

export function getConfirmDeleteTaskConvKeyboard(): InlineKeyboard {
    return new InlineKeyboard()
        .text("yes", "confirm_delete_task").row()
        .text("cancel", "cancel_conv_delete_task").row();
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
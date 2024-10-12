import { SortOrder, type StoredTokenLaunch, TokenLaunchFields } from "starton-periphery";
import type { StoredTasks, StoredTasksRequest, StoredTokenLaunchRequest } from "../db";
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
    addRewardJetton = "addRewardJetton",
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
    start: "<b>Hello, this is Starton</b> (￣▽￣)ノ\nClick /menu to begin.",
    menu: "<b>What would you like to do?</b> ＼(￣o￣)／",
    noLaunches: "No token launches available (￣ヘ￣)",
    error: "Oops! An error occurred. Please try again later 〜(＞_＜)〜",
    idRequest: "Please send the <b>ID</b> of the token launch (⊙_⊙)",
    invalidId: "Invalid <b>ID</b> (￣ヘ￣).",
    addressListRequest: "Please provide a <b>User Address</b> and <b>Task ID</b> (￣▽￣)ノ\n\nExample: <code>userAddress1|taskId1, userAddress2|taskId2</code>",
    invalidAddUsersTasksRelations: "Invalid <b>data</b> (￣ヘ￣).",
    unknown: "I don't understand that command ╮(￣_￣)╭",
    addWalletsSuccess: "Success! Wallets added! ＼(￣▽￣)／\n\n<b>Want to continue?</b> Click /menu",
    createTaskRequest: "Let's create a task!\nWhat should the task include? ╮(￣_￣)╭\n\n<b>Example:</b>\n<code>taskName1|subtaskName1&subtaskDescription1\ntaskName2|subtaskName2&subtaskDescription2</code>",
    invalidAddTasks: "Invalid <b>data</b> (￣ヘ￣).",
    addTasksSuccess: "Success! Tasks added! ＼(￣▽￣)／\n\n<b>Want to continue?</b> Click /menu.",
    noTasks: "No tasks available (￣ヘ￣)",
    deleteTaskRequest: "Please send the <b>Task ID</b> (￣▽￣)ノ\n\nExample: <code>taskID1, taskID2</code>",
    deleteTasksSuccess: "Success! Tasks deleted! ＼(￣▽￣)／\n\n<b>Want to continue?</b> Click /menu.",
    confirmDeleteTask: "Are you sure you want to delete these tasks? ٩(ఠ益ఠ)۶",
    deleteTasksCanceled: "Task deletion canceled successfully! ＼(￣▽￣)／\n\n<b>Want to continue?</b> Click /menu",
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
        // .text("get token launches", "list_launches").row()
        .text("users completed tasks", "add_wallets").row()
        .text("get tasks", "list_tasks").row()
        .text("add reward jettons", "add_reward_jettons").row()
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
        await ctx.reply("(⊙_⊙) Shutta f up, you are not an admin...");
        await ctx.stopPoll();
        return false;
    }

    return true;
}
import { type HearsContext, InlineKeyboard } from "grammy";
import type { MyContext } from "./index";
import { getConfig } from "../config";
import { Address } from "@ton/core";
import {
    type StoredTokenLaunch,
    type LaunchMetadata,
    type JettonMetadata,
    type RewardJetton,
    type RewardPool,
    type StoredTask,
    jettonFromNano,
    toSnakeCase
} from "starton-periphery";
import { setTasksCompletions } from "./handlers";

/**
 * COMMON
 */
interface ICommand {
    command: string,
    description: string,
}

export const commands: ICommand[] = [
    { command: "start", description: "pretty obvious" },
    { command: "menu", description: "this one too" }
];

export type PaginationData = { page: number, limit: number };
export const initPaginationData: PaginationData = {
    page: 1,
    limit: 6,
};

export enum Conversations {
    setTicketsToUsers = "setTicketsToUsers",
    setTasksCompletions = "setTasksCompletions",
    createTask = "createTask",
    deleteTask = "deleteTask",
    setRewardJetton = "setRewardJetton",
    setRewardPool = "setRewardPool",
    listRewardPoolsPrelude = "listRewardPoolsPrelude"
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
    createTaskRequest: "Let's create a task!\nWhat should the task include? ╮(￣_￣)╭\n\n<b>Example:</b>\n<code>ru:taskName1|subtaskName1&subtaskDescription1%en:taskName1|subtaskName1&subtaskDescription1\n---\nru:taskName2|subtaskName2&subtaskDescription2%en:taskName2|subtaskName2&subtaskDescription2</code>",
    invalidAddTasks: "Invalid <b>data</b> (￣ヘ￣).",
    addTasksSuccess: "Success! Tasks added! ＼(￣▽￣)／\n\n<b>Want to continue?</b> Click /menu.",
    noTasks: "No tasks available (￣ヘ￣)",
    deleteTaskRequest: "Please send the <b>Task ID</b> (￣▽￣)ノ\n\nExample: <code>taskID1, taskID2</code>",
    deleteTasksSuccess: "Success! Tasks deleted! ＼(￣▽￣)／\n\n<b>Want to continue?</b> Click /menu.",
    confirmDeleteTask: "Are you sure you want to delete these tasks? ٩(ఠ益ఠ)۶",
    deleteTasksCanceled: "Task deletion canceled successfully! ＼(￣▽￣)／\n\n<b>Want to continue?</b> Click /menu",
    invalidDeleteTasks: "Invalid <b>data</b> (￣ヘ￣).",
    noRewardJettons: "No reward jettons available (￣ヘ￣)",
    noRewardPools: "Reward pools not found (￣ヘ￣)",
    setTicketsToUsers: "Please send the <b>Users Addresses</b> who will be allocated 1 ticket each \n(￣▽￣)ノ\n\nExample: <code>userAddress1, userAddress2, userAddress3</code>",
    invalidSetTicketsToUsers: "Invalid <b>data</b> (￣ヘ￣).",
    addTicketsSuccess: "Success! Tickets added! ＼(￣▽￣)／\n\n<b>Want to continue?</b> Click /menu.",
};

export function getReplyText(key: keyof typeof replies): string {
    return replies[key];
}

export function getLaunchesReply(storedTokenLaunch: (StoredTokenLaunch & Partial<LaunchMetadata>)[]): string {
    return storedTokenLaunch.map(({ creator, metadata, id, createdAt, influencerSupport }) => {
        const date = new Date(Number(createdAt) * 1000).toLocaleDateString("ru-RU", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

        const description = metadata.description
            ? metadata.description.length > 15
                ? `${metadata.description.slice(0, 15)}...`
                : metadata.description
            : "not provided";

        return `${id}.\n` +
            `name: ${metadata.name ?? "unnamed"}\n` +
            `description: ${description}\n` +
            `date: ${date}\n` +
            `creator: ${Address.parse(creator)} \n` +
            `influencers' support: ${influencerSupport}\n`;
    }).join("\n");
}

export function getRewardJettonsReply(rewardJettons: RewardJetton[]): string {
    return rewardJettons.map(
        ({ masterAddress, metadata, currentBalance, lockedForRewards, rewardAmount, isActive }) => {
            return `${metadata.symbol}\n` +
                `${Address.parse(masterAddress)}\n` +
                `${isActive ? "active" : "not active"}\n` +
                `balance: ${jettonFromNano(currentBalance, Number(metadata.decimals ?? 6))} (raw ${currentBalance})\n` +
                `locked: ${jettonFromNano(lockedForRewards, Number(metadata.decimals ?? 6))} (raw ${lockedForRewards})\n` +
                `reward amount: ${jettonFromNano(rewardAmount, Number(metadata.decimals ?? 6))} (raw ${rewardAmount}) \n`;
        }
    ).join("\n");
}

export function getRewardPoolsReply(rewardJettons: (RewardPool & { metadata: JettonMetadata })[]): string {
    return rewardJettons.map(
        ({ rewardJetton, metadata, rewardAmount, }) => {
            return `${metadata.symbol} - ${metadata.name}\n` +
                `jetton address: ${Address.parse(rewardJetton)}\n` +
                `reward amount: ${jettonFromNano(rewardAmount, Number(metadata.decimals ?? 6))} (raw ${rewardAmount}) \n`;
        }
    ).join("\n");
}

export function getTasksReply(storedTasks: StoredTask[]): string {
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

        return `[${taskId}] ${name} - ${formattedDate} - (${status})`;
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
        .text("Set tickets to users", "set_tickets_to_users").row()
        .text("Set tasks completions", "set_tasks_completions").row()
        .text("List tasks", "list_tasks").row()
        .text("List token launches", "list_launches").row()
        .text("Set reward pools", "set_reward_pool")
        .text("List reward pools", "list_reward_pools_prelude").row()
        .text("Set reward jettons", "set_reward_jetton")
        .text("List reward jettons", "list_reward_jettons").row()
        .text("Create tasks", "create_task")
        .text("Delete tasks", "delete_task");
}

export enum ListedObjects {
    Tasks = "tasks",
    Launches = "launches",
    RewardJettons = "reward_jettons",
    RewardPools = "reward_pools"
}

export function getPaginationKeyboard(listedObject: ListedObjects, hasMore: boolean, page: number): InlineKeyboard {
    const keyboard = new InlineKeyboard();

    page > 1 ? keyboard.text("< prev", `prev_${listedObject}`) : keyboard.text(".", "nothing");
    keyboard.text(`· ${page} ·`, "nothing");
    hasMore ? keyboard.text("next >", `next_${listedObject}`).row() : keyboard.text(".", "nothing").row();

    return keyboard.text("« back to menu", "back");
}

export function getResetKeyboard(listedObject: ListedObjects): InlineKeyboard {
    return new InlineKeyboard()
        .text("reset", `reset_${listedObject}`).row()
        .text("< back to menu", "back");
}

export function cancelConversationKeyboard(conversation: Conversations): InlineKeyboard {
    return new InlineKeyboard()
        .text("cancel", `cancel_conv_${toSnakeCase(conversation)}`).row();
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
    const { bot: { admins } } = getConfig();
    if (!admins.includes(ctx.from!.id)) {
        await ctx.reply("(⊙_⊙) Shutta f up, you are not an admin...");
        await ctx.stopPoll();
    }
    return admins.includes(ctx.from!.id);
}
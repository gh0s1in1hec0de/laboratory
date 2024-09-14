import { getMenuKeyboard, getReplyText } from "../constants";
import type { CallbackQueryContext } from "grammy";
import type { MyContext } from "../index";
import { Address } from "@ton/core";

export async function handleEnterConversationCallback(ctx: CallbackQueryContext<MyContext>, conversationName: string): Promise<void> {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(conversationName);
}

export async function handleBackToMenuCallback(ctx: CallbackQueryContext<MyContext>) {
    await ctx.answerCallbackQuery();
    await ctx.callbackQuery.message!.editText(getReplyText("menu"), {
        parse_mode: "HTML",
        reply_markup: getMenuKeyboard()
    });
    await ctx.answerCallbackQuery();
}

export async function handleCancelConversationCallback(ctx: CallbackQueryContext<MyContext>, conversationName: string) {
    await ctx.conversation.exit(conversationName);
    await ctx.answerCallbackQuery("Left conversation");
    await ctx.reply(getReplyText("menu"), {
        parse_mode: "HTML",
        reply_markup: getMenuKeyboard()
    });
}

const mapAddressTasks: Map<string, string[]> = new Map();

export function isReadyUsersTasksToDb(str: string): Map<string, string[]> | null {
    mapAddressTasks.clear();

    for (const pair of str.split(",")) {
        const [userAddress, taskId] = pair.split("|");

        const trimmedAddress = userAddress?.trim();
        const trimmedId = taskId?.trim();

        if (!trimmedAddress || !trimmedId || Address.isAddress(userAddress.trim())) return null;
        // || Address.isAddress(userAddress.trim())

        if (mapAddressTasks.has(trimmedAddress)) {
            mapAddressTasks.get(trimmedAddress)?.push(trimmedId);
        } else {
            mapAddressTasks.set(trimmedAddress, [trimmedId]);
        }
    }

    return mapAddressTasks;
}

const mapTasks: Map<string, string> = new Map();

export function isReadyTasksToDb(str: string): Map<string, string> | null {
    mapTasks.clear();

    for (const pair of str.split(/\r?\n/)) {
        const [taskName, subtasks] = pair.split("|");
        const trimmedTaskName = taskName?.trim();
        const trimmedSubTasks = subtasks?.trim();

        if (!trimmedTaskName || !trimmedSubTasks) return null;

        const subtaskArray = trimmedSubTasks.split("&");
        if (subtaskArray.length % 2 !== 0 || subtaskArray.some(item => item.trim() === "")) return null;

        if (mapTasks.has(trimmedTaskName)) {
            const storedDescription = mapTasks.get(trimmedTaskName);
            mapTasks.set(trimmedTaskName, `${storedDescription}&${subtaskArray.join("&")}`);
        } else {
            mapTasks.set(trimmedTaskName, subtaskArray.join("&"));
        }
    }

    return mapTasks;
}

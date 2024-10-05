import { getMenuKeyboard, getReplyText } from "../constants";
import type { CallbackQueryContext } from "grammy";
import type { MyContext } from "../index";
import { Address } from "@ton/core";

export async function handleEnterConversationCallback(
    ctx: CallbackQueryContext<MyContext>,
    conversationName: string
): Promise<void> {
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

export async function handleCancelConversationCallback(
    ctx: CallbackQueryContext<MyContext>,
    conversationName: string
) {
    await ctx.conversation.exit(conversationName);
    await ctx.answerCallbackQuery("Left conversation");
    await ctx.reply(getReplyText("menu"), {
        parse_mode: "HTML",
        reply_markup: getMenuKeyboard()
    });
}

interface ValidationUsersTasksToDbResult {
    validMap: Map<string, string[]>,
    errors: string[],
}

const mapAddressTasks: Map<string, string[]> = new Map();

export function isReadyUsersTasksToDb(str: string): ValidationUsersTasksToDbResult {
    mapAddressTasks.clear();
    const errors: string[] = [];
    
    let index = 0;

    for (const pair of str.split(",")) {
        const [userAddress, taskId] = pair.split("|");

        const trimmedAddress = userAddress?.trim();
        const trimmedId = taskId?.trim();

        if (!trimmedAddress) {
            errors.push(`Error in line ${index + 1}: empty address`);
            continue;
        }
        try {
            // As isAddress doesn't work the proper way with raw addresses :) Good job Ton!
            Address.parse(trimmedAddress);
        } catch (e) {
            errors.push(`Error in line ${index + 1}: The address looks more like shit`);
            continue;
        }
        if (!trimmedId) {
            errors.push(`Error in line ${index + 1}: empty task id`);
            continue;
        }

        mapAddressTasks.set(trimmedAddress, [
            ...(mapAddressTasks.get(trimmedAddress) ?? []),
            trimmedId
        ]);
        index++;
    }

    return { validMap: mapAddressTasks, errors };
}

interface ValidationTasksToDbResult {
    validMap: Map<string, string>,
    errors: string[],
}

const mapTasks: Map<string, string> = new Map();

export function isReadyTasksToDb(str: string): ValidationTasksToDbResult {
    mapTasks.clear();
    const errors: string[] = [];
    let index = 0;

    for (const pair of str.split(/\r?\n/)) {
        const [taskName, subtasks] = pair.split("|");
        const trimmedTaskName = taskName?.trim();
        const trimmedSubTasks = subtasks?.trim();

        if (!trimmedTaskName) {
            errors.push(`Error in line ${index + 1}: empty task name`);
            continue;
        }

        if (!trimmedSubTasks) {
            errors.push(`Error in line ${index + 1}: empty subtasks`);
            continue;
        }

        const subtaskArray = trimmedSubTasks.split("&");
        if (subtaskArray.length % 2 !== 0 || subtaskArray.some(item => item.trim() === "")) {
            errors.push(`Error in line ${index + 1}: subtask must have a name and description`);
            continue;
        }

        if (mapTasks.has(trimmedTaskName)) {
            const storedDescription = mapTasks.get(trimmedTaskName);
            mapTasks.set(trimmedTaskName, `${storedDescription}&${subtaskArray.join("&")}`);
        } else {
            mapTasks.set(trimmedTaskName, subtaskArray.join("&"));
        }

        index++;
    }

    return { validMap: mapTasks, errors };
}


import { getMenuKeyboard, getReplyText } from "../constants";
import type { CallbackQueryContext } from "grammy";
import type { ManagerContext } from "../index";
import { Address } from "@ton/core";
import { Locales } from "starton-periphery";

export async function handleEnterConversationCallback(
    ctx: CallbackQueryContext<ManagerContext>,
    conversationName: string
): Promise<void> {
    await ctx.answerCallbackQuery();
    await ctx.conversation.enter(conversationName);
}

export async function handleBackToMenuCallback(ctx: CallbackQueryContext<ManagerContext>) {
    await ctx.answerCallbackQuery();
    await ctx.callbackQuery.message!.editText(getReplyText("menu"), {
        parse_mode: "HTML",
        reply_markup: getMenuKeyboard()
    });
    await ctx.answerCallbackQuery();
}

export async function handleCancelConversationCallback(
    ctx: CallbackQueryContext<ManagerContext>,
    conversationName: string
) {
    await ctx.conversation.exit(conversationName);
    await ctx.answerCallbackQuery("Au revoir!");
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

export type TaskParsingResult = {
    tasksByLocale: Map<string, string>, // Map: Localed names -> Localed descriptions
    errors: string[],  // List of validation errors
};

export function parseTasksInputToMergedMap(input: string): TaskParsingResult {
    const tasksByLocale = new Map<string, string>(); // Map for merged task names and descriptions
    const errors: string[] = [];

    // Split the input into task blocks using "---" as the task separator
    input.split(/---/).forEach((taskBlock, taskIndex) => {
        const localizedNames: string[] = [];
        const localizedDescriptions: string[] = [];

        const trimmedBlock = taskBlock.trim();
        if (!trimmedBlock) {
            errors.push(`Task block ${taskIndex + 1} is empty or invalid`);
            return;
        }

        // Match localized tasks
        const matches = Array.from(trimmedBlock.matchAll(/(\w{2})::([^|]+)\|(.+?)(?=\s?%|$)/g));
        if (matches.length === 0) {
            errors.push(`No valid task data found in task block ${taskIndex + 1}`);
            return;
        }

        for (const [, locale, taskName, taskDescription] of matches) {
            const trimmedLocale = locale.trim(); // Avoid repeated trimming
            if (!Object.values(Locales).includes(trimmedLocale as Locales)) {
                errors.push(`Invalid locale '${trimmedLocale}' in task block ${taskIndex + 1}`);
                continue;
            }

            // Collect localized task names and descriptions
            localizedNames.push(`${trimmedLocale}::${taskName.trim()}`);
            localizedDescriptions.push(`${trimmedLocale}::${taskDescription.trim()}`);
        }

        if (localizedNames.length === 0) {
            errors.push(`No valid localized data in task block ${taskIndex + 1}`);
            return;
        }

        // Merge names and descriptions for this task and store in the map
        tasksByLocale.set(localizedNames.join("%"), localizedDescriptions.join("%"));
    });

    return { tasksByLocale, errors };
}

interface ValidationUserAddressesResult {
    validAddresses: string[],
    errors: string[],
}

export function validateUserAddresses(input: string): ValidationUserAddressesResult {
    const validAddresses: string[] = [];
    const errors: string[] = [];

    let index = 0;

    for (const userAddress of input.split(",")) {
        const trimmedAddress = userAddress.trim();

        if (!trimmedAddress) {
            errors.push(`Error in line ${index + 1}: empty address`);
            index++;
            continue;
        }

        try {
            Address.parse(trimmedAddress);
            validAddresses.push(trimmedAddress);
        } catch (e) {
            errors.push(`Error in line ${index + 1}: The address "${trimmedAddress}" looks more like shit`);
        }

        index++;
    }

    return { validAddresses, errors };
}

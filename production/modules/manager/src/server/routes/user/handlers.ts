import { CommonServerError, parseLocaledText } from "starton-periphery";
import { Address } from "@ton/core";
import * as db from "../../../db";
import type {
    GetCallerTicketBalanceRequest,
    ConnectCallerWalletRequest,
    GetWhitelistStatusRequest,
    GetCallerTasksResponse,
    GetCallerTasksRequest,
    RawAddressString,
    Subtask,
    Caller,
    GetCallerRequest
} from "starton-periphery";

export async function connectCallerWallet(
    { address, referral, }: ConnectCallerWalletRequest
): Promise<Caller | string> {
    let maybeParsedReferral: RawAddressString | undefined = undefined;
    if (referral) {
        try {
            maybeParsedReferral = Address.parse(referral).toRawString();
        } catch (e) {
            throw new CommonServerError(400, `invalid referral ${referral}`);
        }
    }
    const res = await db.connectWallet(
        Address.parse(address).toRawString(), maybeParsedReferral,
    );
    return res ?? "user already exists";
}

export async function getCallerTicketBalance(
    { address }: GetCallerTicketBalanceRequest
): Promise<number> {
    const res = await db.getTicketBalance(Address.parse(address).toRawString());
    if (res === null) throw new CommonServerError(400, `user with address not found: ${address}`);
    return res;
}

function parseSubtasks(description: string): Subtask[] {
    const subtasks = description.split("&");
    const result = [];

    for (let i = 0; i < subtasks.length; i += 2) {
        result.push({
            name: subtasks[i],
            description: subtasks[i + 1] || "",
        });
    }
    return result;
}

export async function getCallerTasks(
    { staged, address }: GetCallerTasksRequest
): Promise<GetCallerTasksResponse[]> {
    // Have mercy on our sinful souls, O Lord
    const tasksDb = await db.getTasks(staged === "true");
    if (!tasksDb) return [];

    const usersTasksRelations = address ? await db.getUsersTasksRelations(Address.parse(address).toRawString()) : null;
    return await Promise.all(
        tasksDb.map(async (task) => {
            // task.description example: ru:subtaskName1&subtaskDescription1%en:subtaskName1&subtaskDescription1
            const subQuests = parseSubtasks(task.description);
            return {
                taskId: task.taskId,
                name: task.name,
                description: subQuests,
                rewardTickets: task.rewardTickets,
                createdAt: Number(task.createdAt),
                completed: usersTasksRelations ? usersTasksRelations.some(relation => relation.taskId === task.taskId) : false,
            };
        })
    );
}

export async function getWhitelistStatus(
    { tokenLaunch, callerAddress }: GetWhitelistStatusRequest
): Promise<boolean> {
    return db.checkWhitelistStatus(tokenLaunch, callerAddress);
}

export async function getCaller(
    { address }: GetCallerRequest
): Promise<Caller> {
    const res = await db.getCaller(address);
    if (res === null) throw new CommonServerError(400, `user with address not found: ${address}`);
    return res;
}

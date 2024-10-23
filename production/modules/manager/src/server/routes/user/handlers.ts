import { CommonServerError, } from "starton-periphery";
import { Address } from "@ton/core";
import * as db from "../../../db";
import type {
    GetCallerTicketBalanceRequest,
    ConnectCallerWalletRequest,
    GetCallerTasksResponse,
    GetCallerTasksRequest,
    RawAddressString,
    Subtask,
    Caller,
} from "starton-periphery";

export async function connectCallerWallet(
    { address, referral, }: ConnectCallerWalletRequest
): Promise<Caller> {
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
    if (!res) throw new CommonServerError(400, "user already exists");
    return res;
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
    const tasksDb = await db.getTasks(staged);
    if (!tasksDb) return [];

    const usersTasksRelations = address ? await db.getUsersTasksRelations(Address.parse(address).toRawString()) : null;
    return await Promise.all(
        tasksDb.map(async (task) => {
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

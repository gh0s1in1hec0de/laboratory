import { logger } from "../../../logger";
import * as db from "../../../db";
import { Address } from "@ton/core";

export async function connectCallerWallet({
    address,
    referral,
}: db.ConnectedWalletRequest): Promise<db.Caller | string> {
    try {
        const res = await db.connectWallet(
            Address.parse(address).toRawString(),
            referral && Address.parse(referral).toRawString(),
        );
        if (!res) return "user already exists";
        return res;
    } catch (e) {
        logger().error(`error in http request 'connectWallet': ${e}`);
        return `error: ${e}`;
    }
}

export async function getCallerTicketBalance({
    address,
}: db.TicketBalanceRequest): Promise<number | string> {
    try {
        const res = await db.getTicketBalance(Address.parse(address).toRawString());
        if (res === null) return `user with address not found: ${address}`;
        return res;
    } catch (e) {
        logger().error(`error in http request 'getTicketBalance': ${e}`);
        return `error: ${e}`;
    }
}

function parseSubtasks(description: string): db.Subtask[] {
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


export async function getCallerTasks({
    staged,
    address,
}: db.TasksRequest): Promise<db.TasksResponse[] | string> {
    try {
        const tasksDb = await db.getTasks(staged);
        if (!tasksDb) return [];
        
        const usersTasksRelations = address ? await db.getUsersTasksRelations(Address.parse(address).toRawString()) : null;

        const transformedTasks: db.TasksResponse[] = await Promise.all(
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

        return transformedTasks;
    } catch (e) {
        logger().error(`error in http request 'getTasks': ${e}`);
        return `error: ${e}`;
    }
}

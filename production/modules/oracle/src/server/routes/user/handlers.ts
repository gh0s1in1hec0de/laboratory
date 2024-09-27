import { logger } from "../../../logger";
import { ok as assert } from "assert";
import * as db from "../../../db";

export async function connectWallet({
    address,
}: db.ConnectedWalletRequest) {
    try {
        const res = await db.connectWallet(address);
        return res;
    } catch (e){
        logger().error(`function retrieval error: ${e}`);
    }
}

export async function getTicketBalance({
    address,
}: db.TicketBalanceRequest) {
    try {
        const res = await db.getTicketBalance(address);
        assert(res, "user with address not found: ${address}");
        return res;
    } catch (e) {
        logger().error(`function retrieval error: ${e}`);
    }
}

function parseSubtasks(description: string): Array<{ name: string; description: string }> {
    const subtasks = description.split('&');
    const result = [];

    for (let i = 0; i < subtasks.length; i += 2) {
        result.push({
            name: subtasks[i],
            description: subtasks[i + 1] || "",
        });
    }

    return result;
}


export async function getTasks({
    address,
}: db.TasksRequest) {
    try {
        const res = await db.getTasks(address);
        assert(res, "tasks not found");

        const transformed = res.map(task => {
            const subQuests = parseSubtasks(task.description);

            return {
                title: task.name,
                description: task.reward_tickets,
                subQuests,
            };
        });

        return transformed;
    } catch (e) {
        logger().error(`function retrieval error: ${e}`);
    }
}

import { logger } from "../../../logger";
import * as db from "../../../db";

export async function connectWallet({
    address,
}: db.ConnectedWalletRequest) {
    try {
        const res = await db.connectWallet(address);
        if (!res) return "user already exists";
        return res;
    } catch (e){
        logger().error(`error in http request 'connectWallet': ${e}`);
    }
}

export async function getTicketBalance({
    address,
}: db.TicketBalanceRequest) {
    try {
        const res = await db.getTicketBalance(address);
        if (res === null) return `user with address not found: ${address}`;
        return res;
    } catch (e) {
        logger().error(`error in http request 'getTicketBalance': ${e}`);
    }
}

function parseSubtasks(description: string): Array<{ name: string, description: string }> {
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


export async function getTasks() {
    try {
        const res = await db.getTasks();
        if (!res) return "tasks not found";

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
        logger().error(`error in http request 'getTasks': ${e}`);
    }
}

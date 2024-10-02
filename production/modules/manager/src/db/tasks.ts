import type { SqlClient, StoredTasks, StoredUsersTasksRelations } from "./types";
import { globalClient } from "./db";
import type { RawAddressString } from "starton-periphery";

export async function getTasks(staged: string, client?: SqlClient): Promise<StoredTasks[] | null> {
    const c = client ?? globalClient;

    const res = await c<StoredTasks[]>`
        SELECT *
        FROM tasks
        ${staged ? c`WHERE EXTRACT(EPOCH FROM now()) - created_at <= 7 * 86400` : c``}
  `;
    return res.length ? res : null;
}

export async function getUsersTasksRelation(
    address: RawAddressString,
    taskId: number,
    client?: SqlClient
): Promise<StoredUsersTasksRelations | null> {
    const c = client ?? globalClient;

    const res = await c<StoredUsersTasksRelations[]>`
        SELECT *
        FROM users_tasks_relations
        WHERE caller_address = ${address}
        AND task_id = ${taskId}
  `;
    return res.length ? res[0] : null;
}

export async function storeUserTaskRelations(
    userAddress: string,
    taskId: string,
    client?: SqlClient
): Promise<StoredUsersTasksRelations | null> {
    const res = await (client ?? globalClient)<StoredUsersTasksRelations[]>`
        INSERT INTO users_tasks_relations (caller_address, task_id)
        VALUES (${userAddress}, ${taskId})
        ON CONFLICT DO NOTHING
        RETURNING 1
    `;
    return res.length ? res[0] : null;
}

export async function storeTask(
    taskName: string,
    description: string,
    client?: SqlClient
): Promise<StoredTasks | null> {
    const [name, reward] = taskName.split("$");
    
    const res = await (client ?? globalClient)<StoredTasks[]>`
        INSERT INTO tasks (name, description, reward_tickets)
        VALUES (${name}, ${description}, ${Number(reward)})
        ON CONFLICT DO NOTHING
        RETURNING 1
    `;
    return res.length ? res[0] : null;
}

import type { SqlClient, StoredTasks, StoredUsersTasksRelation } from "./types";
import { globalClient } from "./db";
import type { RawAddressString } from "starton-periphery";

export async function getTasks(staged: string, client?: SqlClient): Promise<StoredTasks[] | null> {
    const c = client ?? globalClient;
    const dbStaged = staged === "true" ? true : false;

    const res = await c<StoredTasks[]>`
        SELECT *
        FROM tasks
        WHERE staged = ${dbStaged}
  `;
    return res.length ? res : null;
}

export async function getUsersTasksRelation(
    address: RawAddressString,
    taskId: number,
    client?: SqlClient
): Promise<StoredUsersTasksRelation | null> {
    const c = client ?? globalClient;

    const res = await c<StoredUsersTasksRelation[]>`
        SELECT *
        FROM users_tasks_relations
        WHERE caller_address = ${address}
        AND task_id = ${taskId}
  `;
    return res.length ? res[0] : null;
}

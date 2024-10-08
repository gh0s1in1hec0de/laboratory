import type { SortedTasks, SqlClient, StoredTasks, StoredUsersTasksRelations } from "./types";
import type { RawAddressString } from "starton-periphery";
import { globalClient } from "./db";

export async function getTasks(
    staged: string,
    client?: SqlClient,
    createdAt: number = 7 * 86400
): Promise<StoredTasks[] | null> {
    const c = client ?? globalClient;

    const res = await c<StoredTasks[]>`
        SELECT *
        FROM tasks
        ${staged === "true" 
        ? c`WHERE EXTRACT(EPOCH FROM now()) - created_at > ${createdAt}`
        : c`WHERE EXTRACT(EPOCH FROM now()) - created_at <= ${createdAt}`}
  `;
    return res.length ? res : null;
}

export async function getTaskById(
    taskId: string,
    client?: SqlClient
): Promise<StoredTasks | null> {
    const c = client ?? globalClient;

    const res = await c<StoredTasks[]>`
        SELECT *
        FROM tasks
        WHERE task_id = ${taskId}
  `;
    return res.length ? res[0] : null;
}

export async function deleteTask(
    taskId: string,
    client?: SqlClient
): Promise<StoredTasks | null> {
    const c = client ?? globalClient;

    const res = await c<StoredTasks[]>`
        DELETE FROM tasks
        WHERE task_id = ${taskId}
        RETURNING *
    `;
       
    return res.length ? res[0] : null;
}

export async function getSortedTasks(
    page: number,
    limit: number,
    client?: SqlClient
): Promise<SortedTasks | null> {
    const offset = (page - 1) * limit;
    const c = client ?? globalClient;

    const res = await c<StoredTasks[]>`
        SELECT *
        FROM tasks
        ORDER BY created_at DESC
        ${page && limit ? c`LIMIT ${limit + 1} OFFSET ${offset}` : c``}
    `;
    
    return !res.length ? null : {
        storedTasks: res.slice(0, limit),
        hasMore: res.length > limit
    };
}

export async function getUsersTasksRelations(
    address: RawAddressString,
    client?: SqlClient
): Promise<Omit<StoredUsersTasksRelations, "callerAddress">[] | null> {
    const c = client ?? globalClient;

    const res = await c<Omit<StoredUsersTasksRelations, "callerAddress">[]>`
        SELECT task_id
        FROM users_tasks_relations
        WHERE caller_address = ${address}
  `;
    return res.length ? res : null;
}

export async function storeUserTaskRelations(
    callerAddress: RawAddressString,
    taskId: string,
    client?: SqlClient
): Promise<StoredUsersTasksRelations | null> {
    const res = await (client ?? globalClient)<StoredUsersTasksRelations[]>`
        INSERT INTO users_tasks_relations (caller_address, task_id)
        VALUES (${callerAddress}, ${taskId})
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
    const res = await (client ?? globalClient)<StoredTasks[]>`
        INSERT INTO tasks (name, description)
        VALUES (${taskName}, ${description})
        ON CONFLICT DO NOTHING
        RETURNING 1
    `;
    return res.length ? res[0] : null;
}

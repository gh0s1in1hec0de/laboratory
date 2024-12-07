import type { RawAddressString, SortedTasks, StoredTask, UsersTasksRelations } from "starton-periphery";
import type { SqlClient, } from "./types";
import { globalClient } from "./db";

export async function getTasks(
    staged: boolean,
    client?: SqlClient,
    createdAt: number = 7 * 86400
): Promise<StoredTask[] | null> {
    const c = client ?? globalClient;

    const res = await c<StoredTask[]>`
        SELECT *
        FROM tasks
        ${staged 
        ? c`WHERE EXTRACT(EPOCH FROM now()) - created_at > ${createdAt}`
        : c`WHERE EXTRACT(EPOCH FROM now()) - created_at <= ${createdAt}`}
  `;
    return res.length ? res : null;
}

export async function getTaskById(
    taskId: string,
    client?: SqlClient
): Promise<StoredTask | null> {
    const c = client ?? globalClient;

    const res = await c<StoredTask[]>`
        SELECT *
        FROM tasks
        WHERE task_id = ${taskId}
  `;
    return res.length ? res[0] : null;
}

export async function deleteTask(
    taskId: string,
    client?: SqlClient
): Promise<StoredTask | null> {
    const c = client ?? globalClient;

    const res = await c<StoredTask[]>`
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

    const res = await c<StoredTask[]>`
        SELECT *
        FROM tasks
        ORDER BY created_at DESC
        ${page && limit ? c`LIMIT ${limit + 1} OFFSET ${offset}` : c``}
    `;

    return !res.length ? null : {
        tasks: res.slice(0, limit),
        hasMore: res.length > limit
    };
}

export async function getUsersTasksRelations(
    address: RawAddressString,
    client?: SqlClient
): Promise<Omit<UsersTasksRelations, "callerAddress">[] | null> {
    const c = client ?? globalClient;

    const res = await c<Omit<UsersTasksRelations, "callerAddress">[]>`
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
): Promise<UsersTasksRelations | null> {
    const res = await (client ?? globalClient)<UsersTasksRelations[]>`
        INSERT INTO users_tasks_relations (caller_address, task_id)
        VALUES (${callerAddress}, ${taskId})
        ON CONFLICT DO NOTHING
        RETURNING 1
    `;
    return res.length ? res[0] : null;
}

export async function incrementUserTickets(
    callerAddress: RawAddressString,
    client?: SqlClient
): Promise<UsersTasksRelations | null> {
    const res = await (client ?? globalClient)<UsersTasksRelations[]>`
        UPDATE callers
        SET ticket_balance = ticket_balance + 1
        WHERE address = ${callerAddress}
        RETURNING *
    `;
    return res.length ? res[0] : null;
}

export async function storeTask(
    taskName: string,
    description: string,
    client?: SqlClient
): Promise<StoredTask | null> {
    const res = await (client ?? globalClient)<StoredTask[]>`
        INSERT INTO tasks (name, description)
        VALUES (${taskName}, ${description})
        ON CONFLICT DO NOTHING
        RETURNING 1
    `;
    return res.length ? res[0] : null;
}

import type { SqlClient, TasksDB } from "./types";
import { globalClient } from "./db";

export async function getTasks(client?: SqlClient): Promise<TasksDB[] | null> {
    const c = client ?? globalClient;

    const res = await c<TasksDB[]>`
        SELECT *
        FROM tasks
  `;
    return res.length ? res : null;
}

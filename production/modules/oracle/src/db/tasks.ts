import type { SqlClient, TasksResponse } from "./types";
import { globalClient } from "./db";

export async function getTasks(address: string, client?: SqlClient): Promise<TasksResponse[] | null> {
    const c = client ?? globalClient;

    const res = await c<TasksResponse[]>`
        SELECT *
        FROM tasks
        ${address === "all" ? "" : c`WHERE address = ${address}`}
  `;
    return res.length ? res : null;
}

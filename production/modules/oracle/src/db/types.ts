import type { Sql } from "postgres";

type SqlTypes = { bigint: bigint };
export type SqlClient = Sql<SqlTypes>;



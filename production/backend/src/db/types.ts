import type {Sql} from "postgres";

type SqlTypes = { bigint: bigint };
export type Client = Sql<SqlTypes>;
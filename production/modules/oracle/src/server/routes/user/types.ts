import { t } from "elysia";

export const ConnectWalletSchema = t.Object({
    address: t.String(),
});

export const GetTicketBalanceSchema = t.Object({
    address: t.String(),
});

export const GetTasksSchema = t.Object({
    address: t.Union([t.String(), t.Literal("all")]),
});

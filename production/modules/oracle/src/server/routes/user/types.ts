import { t } from "elysia";

export const ConnectWalletSchema = t.Object({
    address: t.String(),
});

export const GetTicketBalanceSchema = t.Object({
    address: t.String(),
});

export const GetTasksSchema = t.Object({
    address: t.Optional(t.String()),
});

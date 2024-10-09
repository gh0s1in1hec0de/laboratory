import { t } from "elysia";

export const getAmountSchema = t.Object({
    userAddress: t.String(),
    tokenLaunch: t.Optional(t.String()),
});

export const GetTicketBalanceSchema = t.Object({
    address: t.String(),
});

export const GetTasksSchema = t.Object({
    address: t.Optional(t.String()),
    staged: t.String(),
});
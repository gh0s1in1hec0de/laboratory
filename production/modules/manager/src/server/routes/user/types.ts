import { t } from "elysia";

export const ConnectWalletSchema = t.Object({
    address: t.String(),
    referral: t.Optional(t.String()),
});

export const GetTicketBalanceSchema = t.Object({
    address: t.String(),
});

export const GetTasksSchema = t.Object({
    address: t.Optional(t.String()),
    staged: t.String(),
});

export const GetWhitelistStatusSchema = t.Object({
    tokenLaunch: t.String(),
    callerAddress: t.String(),
});

export const GetCallerSchema = t.Object({
    address: t.String(),
});

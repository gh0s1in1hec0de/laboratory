import { t } from "elysia";

export const ConnectWalletSchema = t.Object({
    address: t.String(),
});

export const getBalancesSchema = t.Object({
    user: t.String(),
    launch: t.Optional(t.String())
});

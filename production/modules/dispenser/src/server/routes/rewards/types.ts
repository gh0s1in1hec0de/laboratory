import { t } from "elysia";

export const GetPositionsOrAmountSchema = t.Object({
    userAddress: t.String(),
    tokenLaunch: t.Optional(t.String()),
});

export const GetRewardBalancesSchema = t.Object({
    userAddress: t.String(),
});

export const GetRewardPoolsSchema = t.Object({
    tokenLaunches: t.String(),
});

import { SortOrder, TokenLaunchFields } from "starton-periphery";
import { t } from "elysia";

export const GetTokenLaunchesSchema = t.Object({
    page: t.Numeric(),
    limit: t.Numeric(),
    sort: t.Enum(TokenLaunchFields),
    order: t.Enum(SortOrder),
    search: t.Optional(t.String())
});
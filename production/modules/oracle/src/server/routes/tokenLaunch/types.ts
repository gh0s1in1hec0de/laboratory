import { SortingOrder, LaunchSortParameters } from "starton-periphery";
import { t } from "elysia";

export const GetTokenLaunchesSchema = t.Object({
    page: t.Numeric(),
    limit: t.Numeric(),
    orderBy: t.Enum(LaunchSortParameters),
    order: t.Enum(SortingOrder),
    search: t.Optional(t.String())
});
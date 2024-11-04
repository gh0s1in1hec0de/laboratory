import { SortingOrder, LaunchSortParameters } from "starton-periphery";
import { t } from "elysia";

export const GetTokenLaunchesSchema = t.Object({
    page: t.Numeric(),
    limit: t.Numeric(),
    orderBy: t.Enum(LaunchSortParameters),
    order: t.Enum(SortingOrder),
    succeed: t.Optional(t.String()), // true | false | undefined (succeed / failed) filter
    createdBy: t.Optional(t.String()), // creator address | undefined (my tokens) filter
    search: t.Optional(t.String())
});

export const GetTokenLaunchSchema = t.Object({
    creator: t.Optional(t.String()),
    address: t.Optional(t.String()),
    metadataUri: t.Optional(t.String())
});

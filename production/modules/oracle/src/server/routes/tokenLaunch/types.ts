import { SortingOrder, LaunchSortParameters } from "starton-periphery";
import { t } from "elysia";

export const GetTokenLaunchesSchema = t.Object({
    page: t.Numeric(),
    limit: t.Numeric(),
    orderBy: t.Enum(LaunchSortParameters),
    order: t.Enum(SortingOrder),
    succeed: t.Optional(t.Boolean()),
    createdBy: t.Optional(t.String()),
    search: t.Optional(t.String())
});

export const GetTokenLaunchSchema = t.Object({
    address: t.Optional(t.String()),
    metadataUri: t.Optional(t.String())
});
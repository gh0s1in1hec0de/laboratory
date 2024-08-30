import { SortField, SortOrder } from "starton-periphery";
import { t } from "elysia";

export const GetTokenLaunchesSchema = t.Object({
    page: t.Numeric(),
    limit: t.Numeric(),
    sort: t.Enum(SortField),
    order: t.Enum(SortOrder),
    search: t.Optional(t.String())
});

export interface GetTokenLaunchesRequest {
  page: number,
  limit: number,
  sort: SortField,
  order: SortOrder,
  search?: string,
}
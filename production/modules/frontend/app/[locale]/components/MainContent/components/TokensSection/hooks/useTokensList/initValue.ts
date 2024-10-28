import { LaunchSortParameters, SortingOrder, GetLaunchesChunkRequest, GetLaunchesChunkResponse } from "starton-periphery";

export const initialFilterData: GetLaunchesChunkRequest = {
  page: 1,
  limit: 10,
  orderBy: LaunchSortParameters.CREATED_AT,
  order: SortingOrder.HIGH_TO_LOW,
};

export const initialLaunchesData: GetLaunchesChunkResponse = {
  launchesChunk: [],
  hasMore: true,
};

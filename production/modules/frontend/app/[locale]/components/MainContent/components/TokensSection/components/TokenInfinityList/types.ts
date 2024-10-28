import { GetLaunchesChunkResponse } from "starton-periphery";

export interface TokenInfinityListProps {
  fetchNextPage: () => Promise<void>;
  launchesData: GetLaunchesChunkResponse;
  isLoadingNextPage: boolean;
}


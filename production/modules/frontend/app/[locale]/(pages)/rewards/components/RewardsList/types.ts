import { GetUserBalancesResponse, GetRewardPoolsResponse } from "starton-periphery";

export interface RewardsListProps {
  extendedBalances: GetUserBalancesResponse;
  isLoading: boolean;
  errorText: string;
  rewardPools: GetRewardPoolsResponse;
}

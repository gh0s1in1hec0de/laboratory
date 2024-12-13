import { GetUserBalancesResponse, GetRewardPoolsResponse, Caller } from "starton-periphery";

export interface RewardsListProps {
  extendedBalances: GetUserBalancesResponse;
  isLoading: boolean;
  errorText: string;
  rewardPools: GetRewardPoolsResponse;
  callerData: Caller | null;
}

import type { 
  GetRewardJettonBalancesRequest, 
  GetRewardJettonBalancesResponse, 
  GetRewardPoolsRequest, 
  GetRewardPoolsResponse 
} from "starton-periphery";
import { dispenserService } from "@/api";
import { REWARDS_ERROR } from "@/errors";
import { REWARDS_ROUTES } from "@/routes";
import { Address } from "@ton/core";

async function getRewardPools({
  tokenLaunches
}: GetRewardPoolsRequest): Promise<GetRewardPoolsResponse> {
  try {
    const parsedTokenLaunches = tokenLaunches
      .filter(Boolean)
      .map((launch) => Address.parse(launch).toRawString());

    const { data } = await dispenserService.get<GetRewardPoolsResponse>(REWARDS_ROUTES.GetRewardPools, {
      params: {
        tokenLaunches: JSON.stringify(parsedTokenLaunches)
      }
    });

    return data;
  } catch (error) {
    console.error(REWARDS_ERROR.GetRewardPools, error);
    throw error;
  }
}

async function getRewardBalances({
  userAddress
}: GetRewardJettonBalancesRequest): Promise<GetRewardJettonBalancesResponse> {
  try {
    const { data } = await dispenserService.get<GetRewardJettonBalancesResponse>(REWARDS_ROUTES.GetRewardBalances, {
      params: {
        userAddress: Address.parse(userAddress).toRawString()
      }
    });

    return data;
  } catch (error) {
    console.error(REWARDS_ERROR.GetRewardBalances, error);
    throw error;
  }
}

export const rewardsService = {
  getRewardPools,
  getRewardBalances,
};

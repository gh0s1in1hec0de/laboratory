import { Caller, ExtendedUserBalance, JettonMetadata, RewardPool } from "starton-periphery";

export interface RewardsCardProps {
  extendedBalance: ExtendedUserBalance;
  rewardPool?: (RewardPool & {
    metadata: JettonMetadata;
  })[];
  callerData: Caller | null;
}

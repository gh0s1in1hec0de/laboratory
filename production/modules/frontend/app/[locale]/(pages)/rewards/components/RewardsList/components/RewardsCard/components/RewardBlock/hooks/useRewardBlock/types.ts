import { JettonMetadata, RewardPool, ExtendedUserBalance } from "starton-periphery";

export interface useRewardBlockProps {
  rewardPool: RewardPool & { metadata: JettonMetadata };
  extendedBalance: ExtendedUserBalance;
}

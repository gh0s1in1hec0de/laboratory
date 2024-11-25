import { JettonMetadata, RewardPool, ExtendedUserBalance } from "starton-periphery";

export interface RewardBlockProps {
  rewardPool: RewardPool & { metadata: JettonMetadata };
  extendedBalance: ExtendedUserBalance;
}

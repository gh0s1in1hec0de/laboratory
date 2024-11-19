import { RewardPool, JettonMetadata } from "starton-periphery";

export interface RewardCardProps {
  rewardPool: RewardPool & { metadata: JettonMetadata };
}

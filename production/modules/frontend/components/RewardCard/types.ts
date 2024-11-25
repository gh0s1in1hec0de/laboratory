import { JettonMetadata, RewardPool } from "starton-periphery";

export interface RewardCardProps {
  rewardPool: RewardPool & { metadata: JettonMetadata };
}

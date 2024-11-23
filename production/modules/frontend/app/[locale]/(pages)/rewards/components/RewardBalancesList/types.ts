import { JettonMetadata, UserRewardJettonBalance } from "starton-periphery";

export interface RewardBalancesListProps {
  rewardBalances: (UserRewardJettonBalance & {
    metadata: JettonMetadata;
})[];
}

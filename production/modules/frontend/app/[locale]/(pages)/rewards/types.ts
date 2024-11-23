export enum RewardsTabsValues {
  CLAIMS = "Claims",
  REWARDS = "Rewards",
}

export interface RewardsTab {
  label: string;
  value: RewardsTabsValues;
}

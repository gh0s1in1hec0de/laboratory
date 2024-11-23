"use client";

import Grid from "@mui/material/Grid2";
import { RewardsHeader } from "./components/RewardsHeader";
import { RewardsList } from "./components/RewardsList";
import { useState } from "react";
import { CustomTabs } from "@/common/CustomTabs";
import { RewardsTabsValues } from "./types";
import { REWARDS_TABS } from "./constants";
import { useRewardsList } from "./hooks/useRewardsList";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";
import { RewardBalancesList } from "./components/RewardBalancesList";
import { CustomButton } from "@/common/CustomButton";
import { TonProvider } from "@/providers/ton";

export default function Rewards() {
  const t = useTranslations("Rewards");
  const [selectedTab, setSelectedTab] = useState<RewardsTabsValues>(RewardsTabsValues.CLAIMS);
  const {
    extendedBalances,
    isLoading,
    errorText,
    rewardPools,
    rewardBalances,
  } = useRewardsList({ selectedTab });

  return (
    <Grid
      container
      width="100%"
      gap={1.5}
    >
      <RewardsHeader />

      <CustomTabs 
        variant="transparentOutline"
        selectedTab={selectedTab}
        onChange={setSelectedTab}
        disabled={isLoading}
        tabs={REWARDS_TABS}
      />

      {selectedTab === RewardsTabsValues.CLAIMS ? (
        <RewardsList
          extendedBalances={extendedBalances}
          isLoading={isLoading}
          errorText={errorText}
          rewardPools={rewardPools}
        />
      ) : !rewardBalances ? (
        <Grid
          container
          width="100%"
          justifyContent="center"
        >
          <Label
            label={t("noRewardBalances")}
            variantColor="gray"
            variantSize="regular16"
          />
        </Grid>
      ) : (
        <TonProvider>
          <RewardBalancesList
            rewardBalances={rewardBalances}
          />
        </TonProvider>
      )}
    </Grid>
  );
}

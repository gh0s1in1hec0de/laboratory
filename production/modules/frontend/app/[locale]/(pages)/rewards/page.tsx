"use client";

import Grid from "@mui/material/Grid2";
import { RewardsHeader } from "./components/RewardsHeader";
import { RewardsList } from "./components/RewardsList";
import { useState } from "react";
import { CustomTabs } from "@/common/CustomTabs";
import { RewardsTabsValues } from "./types";
import { REWARDS_TABS } from "./constants";
import { useRewardsList } from "./hooks/useRewardsList";
import { CustomAvatar } from "@/common/CustomAvatar";
import { Label } from "@/common/Label";
import { jettonFromNano } from "starton-periphery";

export default function Rewards() {
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

      
      <RewardsList
        extendedBalances={extendedBalances}
        isLoading={isLoading}
        errorText={errorText}
        rewardPools={rewardPools}
      />
      
      {/* {selectedTab === RewardsTabsValues.CLAIMS ? (
        <RewardsList
          extendedBalances={extendedBalances}
          isLoading={isLoading}
          errorText={errorText}
          rewardPools={rewardPools}
        />
      ) : rewardBalances?.map((reward, index) => (
        <Grid 
          key={index}
          container 
          width="100%"
          alignItems="center"
        >
          <Grid
            container
            paddingLeft={1.5}
          >
            <CustomAvatar
              size="extraSmall"
              src={reward.metadata.image ?? "https://icdn.lenta.ru/images/2024/03/18/12/20240318124428151/square_1280_828947c85a8838d217fe9fcc8b0a17ec.jpg"}
              alt="Reward Logo"
            />
          </Grid>

          <Grid
            container
            size="grow"
            paddingLeft={1}
          >
            <Label
              label={reward.metadata.name ?? "Unknown"}
              variantSize="medium16"
              cropped
            />
          </Grid>

          <Grid
            container
            paddingX={1.5}
          >
            <Label
              label={`${jettonFromNano(reward.balance)} $${reward.metadata.symbol ?? "UNKNWN"}`}
              variantSize="regular14"
              variantColor="gray"
              cropped
            />
          </Grid>
        </Grid>
      ))} */}
    </Grid>
  );
}

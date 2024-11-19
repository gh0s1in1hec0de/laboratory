"use client";

import Grid from "@mui/material/Grid2";
import { useRewardsList } from "./hooks/useRewardsList";
import { RewardsCard } from "./components/RewardsCard";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { Label } from "@/common/Label";

export function RewardsList() {
  const {
    extendedBalances,
    isLoading,
    errorText,
  } = useRewardsList();

  return (
    <LoadingWrapper
      isLoading={isLoading}
    >
      <Grid
        container
        width="100%"
        flexDirection="column"
        gap={1.5}
      >
        {errorText && (
          <Label
            label={errorText}
            variantColor="red"
            variantSize="regular14"
          />
        )}
        
        {extendedBalances && Object.entries(extendedBalances).map(([key, extendedBalance]) => (
          <RewardsCard
            key={key}
            {...extendedBalance}
          />
        ))}
      </Grid>
    </LoadingWrapper>
  );
}

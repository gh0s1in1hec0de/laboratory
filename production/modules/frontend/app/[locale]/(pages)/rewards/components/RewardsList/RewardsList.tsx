"use client";

import Grid from "@mui/material/Grid2";
import { RewardsCard } from "./components/RewardsCard";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";
import { TonProvider } from "@/providers/ton";
import { RewardsListProps } from "./types";
import { RewardsListSkeleton } from "./components/RewardsListSkeleton";

export function RewardsList({
  extendedBalances,
  isLoading,
  errorText,
  rewardPools,
  callerData,
}: RewardsListProps) {
  const t = useTranslations("Rewards");

  return (
    <LoadingWrapper
      isLoading={isLoading}
      skeleton={<RewardsListSkeleton/>}
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

        {!extendedBalances ? (
          <Label
            label={t("noBalances")}
            variantColor="gray"
            textAlign="center"
            variantSize="regular16"
          />
        ) : (
          <TonProvider>
            {Object.entries(extendedBalances).map(([key, extendedBalance]) => {
              const rewardPoolForKey = rewardPools?.[key];

              return (
                <RewardsCard
                  key={key}
                  rewardPool={rewardPoolForKey}
                  extendedBalance={extendedBalance}
                  callerData={callerData}
                />
              );
            })}
          </TonProvider>
        )}
      </Grid>
    </LoadingWrapper>
  );
}

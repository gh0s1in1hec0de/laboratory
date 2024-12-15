"use client";

import Grid from "@mui/material/Grid2";
import { RewardsCard } from "./components/RewardsCard";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";
import { TonProvider } from "@/providers/ton";
import { RewardsListProps } from "./types";
import { RewardsListSkeleton } from "./components/RewardsListSkeleton";
import { CustomToast } from "@/common/CustomToast";
import { useToggle } from "@/hooks";
import { useMemo } from "react";

export function RewardsList({
  extendedBalances,
  isLoading,
  errorText,
  rewardPools,
  callerData,
}: RewardsListProps) {
  const t = useTranslations("Rewards");
  const [openToast, toggleOpenToast] = useToggle(true);

  const hasSuccessfulBalance = useMemo(() => {
    if (!extendedBalances) return false;
    return Object.values(extendedBalances).some(
      (extendedBalance) => extendedBalance.isSuccessful === true
    );
  }, [extendedBalances]);

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

            {hasSuccessfulBalance && (
              <CustomToast
                open={openToast}
                toggleOpen={toggleOpenToast}
                text={t("claimRewardsToast")}
                duration={10000}
                severity="success"
              />
            )}
          </TonProvider>
        )}
      </Grid>
    </LoadingWrapper>
  );
}

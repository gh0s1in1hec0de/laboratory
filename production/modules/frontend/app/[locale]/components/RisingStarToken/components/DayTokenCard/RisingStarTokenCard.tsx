"use client";

import { LoadingWrapper } from "@/common/LoadingWrapper";
import { CustomAvatar } from "@/common/CustomAvatar";
import Grid from "@mui/material/Grid2";
import { RisingStarTokenCardSkeleton } from "./components/DayTokenCardSkeleton";
import { TokenInfo } from "./components/TokenInfo";
import { ProgressInfo } from "./components/ProgressInfo";
import { useRisingStarToken } from "./hooks/useRisingStarToken";
import { fromNano } from "@ton/core";
import { Label } from "@/common/Label";

export function RisingStarTokenCard() {
  const { 
    isLoading,
    errorText,
    tokenData
  } = useRisingStarToken();

  if (errorText && !tokenData) {
    return (
      <Grid container size={{ xs: 12 }} justifyContent="center">
        <Label label={errorText} variantSize="medium14" variantColor="red" />
      </Grid>
    );
  }
  
  return (
    <LoadingWrapper
      isLoading={isLoading}
      skeleton={<RisingStarTokenCardSkeleton />}
    >
      <Grid
        container
        gap={1}
        size={{ xs: 12 }}
      >
        <CustomAvatar
          size="medium"
          src={tokenData?.metadata.image || ""}
          alt="https://lirp.cdn-website.com/93aa737e/dms3rep/multi/opt/hacker-computer-systems-225f9fa9-1920w.jpg"
          // alt="Rising Star Token"
        />

        <TokenInfo
          name={`$${tokenData?.metadata.symbol || "UNKNWN"}`}
          name2={tokenData?.metadata.name || "Unknown"}
          holders={tokenData?.activeHolders || 0}
        />

        <ProgressInfo
          collected={Number(fromNano(tokenData?.totalTonsCollected || 0))}
          max={Number(fromNano(tokenData?.minTonTreshold || 0))}
        />
      </Grid>
    </LoadingWrapper>
  );
}

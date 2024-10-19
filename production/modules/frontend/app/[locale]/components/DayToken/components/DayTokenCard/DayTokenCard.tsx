"use client";

import { LoadingWrapper } from "@/common/LoadingWrapper";
import { CustomAvatar } from "@/common/CustomAvatar";
import Grid from "@mui/material/Grid2";
import { DayTokenCardSkeleton } from "./components/DayTokenCardSkeleton";
import { TokenInfo } from "./components/TokenInfo";
import { ProgressInfo } from "./components/ProgressInfo";

export function DayTokenCard() {
  return (
    <LoadingWrapper
      isLoading={false}
      skeleton={<DayTokenCardSkeleton />}
    >
      <Grid
        container
        gap={1}
        size={{ xs: 12 }}
      >
        <CustomAvatar
          size="medium"
          src="https://lirp.cdn-website.com/93aa737e/dms3rep/multi/opt/hacker-computer-systems-225f9fa9-1920w.jpg"
          alt="Day token"
        />

        <TokenInfo
          name="$TIKER"
          holders={2000}
        />

        <ProgressInfo
          collected={400}
          max={1000}
        />
      </Grid>
    </LoadingWrapper>
  );
}

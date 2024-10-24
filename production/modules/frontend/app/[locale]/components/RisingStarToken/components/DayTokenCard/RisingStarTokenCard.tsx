"use client";

import { LoadingWrapper } from "@/common/LoadingWrapper";
import { CustomAvatar } from "@/common/CustomAvatar";
import Grid from "@mui/material/Grid2";
import { RisingStarTokenCardSkeleton } from "./components/DayTokenCardSkeleton";
import { TokenInfo } from "./components/TokenInfo";
import { ProgressInfo } from "./components/ProgressInfo";

export function RisingStarTokenCard() {
  return (
    <LoadingWrapper
      isLoading={false}
      skeleton={<RisingStarTokenCardSkeleton />}
    >
      <Grid
        container
        gap={1}
        size={{ xs: 12 }}
      >
        <CustomAvatar
          size="medium"
          src="https://lirp.cdn-website.com/93aa737e/dms3rep/multi/opt/hacker-computer-systems-225f9fa9-1920w.jpg"
          alt="Rising Star Token"
        />

        <TokenInfo
          name="$TIKER"
          name2="Name"
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

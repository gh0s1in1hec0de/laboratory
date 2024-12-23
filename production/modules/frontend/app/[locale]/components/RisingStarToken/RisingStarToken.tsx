"use client";

import { Label } from "@/common/Label";
import { MainBox } from "@/common/MainBox";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { RisingStarTokenCard } from "./components/DayTokenCard";
import { StarClubDrawer } from "./components/StarClubDrawer";
import { useRisingStarToken } from "./hooks/useRisingStarToken";
import { LoadingWrapper } from "@/common/LoadingWrapper";

export function RisingStarToken() {
  const {
    isLoading,
    errorText,
    tokenData,
    isPending,
    handleRedirectToLaunch,
    isOpenDrawer,
    toggleOpenDrawer,
  } = useRisingStarToken();
  const t = useTranslations("Top");

  return (
    <LoadingWrapper isLoading={isPending}>
      <MainBox
        container
        rounded="xl"
        fullWidth
        position="relative"
        minHeight="80px"
        paddingX={2}
        paddingY={1.5}
        gap={2}
        width="100%"
        onClick={tokenData || errorText ? handleRedirectToLaunch : undefined}
        style={{ cursor: tokenData || errorText ? "pointer" : "default" }}
      >
        <StarClubDrawer
          isOpenDrawer={isOpenDrawer}
          toggleOpenDrawer={toggleOpenDrawer}
        />

        <Grid
          container
          size={6}
        >
          <Label
            label={t("risingStarTitle")}
            variantSize="medium16"
            offUserSelect
            cropped
          />
        </Grid>

        <RisingStarTokenCard
          isLoading={isLoading}
          errorText={errorText}
          tokenData={tokenData}
        />
      </MainBox>
    </LoadingWrapper>
  );
}

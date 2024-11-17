import { LoadingWrapper } from "@/common/LoadingWrapper";
import { CustomAvatar } from "@/common/CustomAvatar";
import Grid from "@mui/material/Grid2";
import { RisingStarTokenCardSkeleton } from "./components/DayTokenCardSkeleton";
import { TokenInfo } from "./components/TokenInfo";
import { ProgressInfo } from "./components/ProgressInfo";
import { fromNano } from "@ton/core";
import { Label } from "@/common/Label";
import { RisingStarTokenCardProps } from "./types";

export function RisingStarTokenCard({
  isLoading,
  errorText,
  tokenData
}: RisingStarTokenCardProps) {

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
        size={12}
      >
        <CustomAvatar
          size="medium"
          src={tokenData?.metadata.image || "https://icdn.lenta.ru/images/2024/03/18/12/20240318124428151/square_1280_828947c85a8838d217fe9fcc8b0a17ec.jpg"}
          alt="Rising Star Token"
        />

        <TokenInfo
          symbol={`$${tokenData?.metadata.symbol || "UNKNWN"}`}
          name={tokenData?.metadata.name || "Unknown"}
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

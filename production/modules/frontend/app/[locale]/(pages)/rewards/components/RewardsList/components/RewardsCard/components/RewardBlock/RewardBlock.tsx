import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { CustomAvatar } from "@/common/CustomAvatar";
import {
  jettonFromNano
} from "starton-periphery";
import { RewardBlockProps } from "./types";
import { useRewardBlock } from "./hooks/useRewardBlock";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { RewardBlockSkeleton } from "./hooks/components/RewardBlockSkeleton";

export function RewardBlock({
  rewardPool,
  extendedBalance
}: RewardBlockProps){
  const {
    displayValue,
    isLoading
  } = useRewardBlock({ rewardPool, extendedBalance });

  return (
    <LoadingWrapper 
      isLoading={isLoading}
      skeleton={<RewardBlockSkeleton/>}
    >
      <Grid
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
            src={rewardPool.metadata.image}
            alt="Reward Logo"
          />
        </Grid>

        <Grid
          container
          size="grow"
          paddingLeft={1}
        >
          <Label
            label={rewardPool.metadata.name ?? "Unknown"}
            variantSize="medium16"
            cropped
          />
        </Grid>

        <Grid
          container
          paddingX={1.5}
        >
          <Label
            label={`${jettonFromNano(displayValue || 0)} $${rewardPool.metadata.symbol ?? "UNKNWN"}`}
            variantSize="regular14"
            variantColor="gray"
            cropped
          />
        </Grid>

        <Grid container size={12} paddingTop={1}>
          <div style={{ width: "100%", height: "1px", backgroundColor: "var(--black-regular)" }} />
        </Grid>
      </Grid>
    </LoadingWrapper>
  );
}

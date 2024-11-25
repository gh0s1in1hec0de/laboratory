import { CustomAvatar } from "@/common/CustomAvatar";
import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import {
  jettonFromNano
} from "starton-periphery";
import { RewardCardProps } from "./types";

export function RewardCard({
  rewardPool,
}: RewardCardProps) {


  return (
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
          src={rewardPool.metadata.image ?? "https://icdn.lenta.ru/images/2024/03/18/12/20240318124428151/square_1280_828947c85a8838d217fe9fcc8b0a17ec.jpg"}
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
          label={`${jettonFromNano(rewardPool.rewardAmount)} $${rewardPool.metadata.symbol ?? "UNKNWN"}`}
          variantSize="regular14"
          variantColor="gray"
          cropped
        />
      </Grid>

      <Grid container size={12} paddingTop={1}>
        <div style={{ width: "100%", height: "1px", backgroundColor: "var(--black-regular)" }} />
      </Grid>
    </Grid>
  );
}

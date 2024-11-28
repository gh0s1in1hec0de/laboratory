import { CustomAvatar } from "@/common/CustomAvatar";
import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import {
  jettonFromNano
} from "starton-periphery";
import { RewardCardProps } from "./types";
import { toCorrectAmount } from "@/utils";
import { useLocale } from "next-intl";

export function RewardCard({
  rewardPool,
}: RewardCardProps) {
  const locale = useLocale();

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
          // todo: заменить если цены отъебнут
          // label={`${jettonFromNano(rewardPool.rewardAmount)} $${rewardPool.metadata.symbol ?? "UNKNWN"}`}
          label={`${toCorrectAmount({ amount: Number(jettonFromNano(rewardPool.rewardAmount)), locale: locale as "en" | "ru" })} $${rewardPool.metadata.symbol ?? "UNKNWN"}`}
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

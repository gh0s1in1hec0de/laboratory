import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { StarIcon } from "@/icons";
import { MainInfoProps } from "./types";
import { useTranslations } from "next-intl";

export function MainInfo({
  symbol,
  name,
  holders,
  showHolders,
}: MainInfoProps) {
  const t = useTranslations("CurrentLaunch");

  return (
    <Grid
      container
      alignItems="center"
      flexDirection="column"
      gap={0.5}
    >
      <Label
        label={symbol}
        variantSize="semiBold24"
      />

      <Grid
        container
        alignItems="center"
        gap={1}
      >
        <Label
          label={name}
          variantSize="regular16"
        />

        {showHolders && (
          <Grid
            container
            alignItems="center"
            gap={0.5}
          >
            <StarIcon />

            <Label
              label={`${holders} ${t("holdersLabel")}`}
              variantSize="regular14"
              variantColor="gray"
            />
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}

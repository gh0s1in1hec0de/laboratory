import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { StarIcon } from "@/icons";
import { TokenInfoProps } from "./types";
import { useTranslations } from "next-intl";

export function TokenInfo({
  name,
  name2,
  holders,
}: TokenInfoProps) {
  const t = useTranslations("Top");

  return (
    <Grid
      container
      justifyContent="center"
      direction="column"
      size="grow"
    >
      <Label
        label={name}
        variantSize="bold18"
        cropped
      />

      <Grid
        container
        alignItems="center"
        gap={1}
      >
        <Label
          label={name2}
          variantSize="regular16"
        />

        <Grid
          container
          alignItems="center"
          gap={0.5}
        >
          <StarIcon />

          <Label
            label={`${holders} ${t("holdersTitle")}`}
            variantSize="regular14"
            variantColor="gray"
          />
        </Grid>
      </Grid>
    </Grid>
  );
}

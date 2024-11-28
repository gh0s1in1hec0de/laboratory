import { Label } from "@/common/Label";
import { StarIcon } from "@/icons";
import Grid from "@mui/material/Grid2";
import { AdditionalInfoProps } from "./types";
import { useTranslations } from "next-intl";
import { useAdditionalInfo } from "./hooks/useAdditionalInfo";

export function AdditionalInfo({ holders, timings, isSuccessful }: AdditionalInfoProps) {
  const t = useTranslations("CurrentLaunch");
  const { renderPhase } = useAdditionalInfo(timings, isSuccessful);

  return (
    <Grid
      container
      gap={0.5}
      size="grow"
      alignItems="center"
    >
      {renderPhase()}
      
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
          offUserSelect
        />
      </Grid>
    </Grid>
  );
}

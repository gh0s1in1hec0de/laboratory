import Grid from "@mui/material/Grid2";
import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";
import { ClaimButtonsProps } from "./types";

export function ClaimButtons({
  isLoading,
}: ClaimButtonsProps) {
  const t = useTranslations("CurrentLaunch.contribute.claimButtons");

  return (
    <Grid
      container
      width="100%"
    >
      <CustomButton
        fullWidth
        padding="10px"
        // onClick={onClickBuyTokens}
        // disabled={!isValidAmount || isLoading}
      >
        <Label
          label={isLoading ? t("loading") : t("label")}
          variantSize="regular16"
        />
      </CustomButton>
    </Grid>
  );
}

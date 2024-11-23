import { useTranslations } from "next-intl";
import Grid from "@mui/material/Grid2";
import { CustomButton } from "@/common/CustomButton";
import { ArrowUpRightIcon } from "@/icons";
import { Label } from "@/common/Label";

export function GetTicketsButton() {
  const t = useTranslations("CurrentLaunch.contribute");

  return (
    <CustomButton
      fullWidth
      padding="10px"
      background="gray"
    >
      <Grid 
        container
        gap={1}
        alignItems="center"
        justifyContent="center"
      >
        <ArrowUpRightIcon />
        <Label
          label={t("getStarTicket")}
          variantSize="regular16"
          offUserSelect
        />
      </Grid>
    </CustomButton>
  );
}

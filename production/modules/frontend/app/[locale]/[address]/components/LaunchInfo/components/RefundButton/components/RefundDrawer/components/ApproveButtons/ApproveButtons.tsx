import { ApproveButtonsProps } from "./types";
import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";
import { CustomButton } from "@/common/CustomButton";

export function ApproveButtons({
  onClickRefund,
  toggleOpenDrawer,
}: ApproveButtonsProps) {
  const t = useTranslations("CurrentLaunch.info.refundButton.drawer.approveButtons");

  function handleClickRefund() {
    toggleOpenDrawer();
    onClickRefund();
  }

  return (
    <Grid
      container
      width="100%"
      gap={1}
    >
      <Label
        label={t("title")}
        variantSize="semiBold18"
      />

      <Grid
        container
        width="100%"
        gap={1}
      >
        <Grid container size="grow">
          <CustomButton
            padding="10px 8px"
            fullWidth
            onClick={toggleOpenDrawer}
          >
            <Label
              label={t("no")}
              variantSize="medium16"
            />
          </CustomButton>
        </Grid>

        <Grid container size="grow">
          <CustomButton
            padding="10px 8px"
            background="gray"
            fullWidth
            onClick={handleClickRefund}
          >
            <Label
              label={t("yes")}
              variantSize="medium16"
            />
          </CustomButton>
        </Grid>
      </Grid>
    </Grid>
  );
}

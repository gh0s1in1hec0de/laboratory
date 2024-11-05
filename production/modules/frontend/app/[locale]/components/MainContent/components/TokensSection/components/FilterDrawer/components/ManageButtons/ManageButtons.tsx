import Grid from "@mui/material/Grid2";
import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { ManageButtonsProps } from "./types";
import { initialFilterData } from "../../../../hooks/useTokensList/initValue";
import { useTranslations } from "next-intl";

export function ManageButtons({
  hasFilterDataChanged,
  handleResetFilter,
  handleApplyFilter,
}: ManageButtonsProps) {
  const t = useTranslations("Top.filterDrawer");
  
  return (
    <Grid
      container
      width="100%"
      gap={1}
    >
      <Grid size="grow">
        <CustomButton
          fullWidth
          padding="10px 6px"
          background="gray"
          disabled={!hasFilterDataChanged(initialFilterData)}
          onClick={handleResetFilter}
        >
          <Label
            label={t("resetButton")}
            variantSize="medium16"
            cropped
          />
        </CustomButton>
      </Grid>

      <Grid size="grow">
        <CustomButton
          fullWidth
          padding="10px 6px"
          disabled={!hasFilterDataChanged()}
          onClick={handleApplyFilter}
        >
          <Label
            label={t("applyButton")}
            variantSize="medium16"
            cropped
          />
        </CustomButton>
      </Grid>
    </Grid>
  );
}

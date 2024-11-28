import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { CustomButton } from "@/common/CustomButton";
import { ArrowUpRightIcon } from "@/icons";
import { useTranslations } from "next-intl";
import { SupportButtonProps } from "./types";

export function SupportButton({
  withLabel = true,
}: SupportButtonProps) {
  const t = useTranslations("SupportButton");

  function handleClick() {
    window.open("https://t.me/sashabreak", "_blank");
  }

  return (
    <Grid
      container
      gap={1.5}
      width="100%"
    >
      {withLabel && (
        <Grid container size={12} justifyContent="center">
          <Label
            label={t("title")}
            variantSize="regular16"
          />
        </Grid>
      )}

      <CustomButton
        onClick={handleClick}
        background="gray"
        padding="10px 0"
        fullWidth
      >
        <Grid
          container
          gap={1}
          alignItems="center"
          justifyContent="center"
        >
          <ArrowUpRightIcon />
          <Label
            label={t("buttonLabel")}
            variantSize="medium16"
            offUserSelect
          />
        </Grid>
      </CustomButton>
    </Grid>
  );
}

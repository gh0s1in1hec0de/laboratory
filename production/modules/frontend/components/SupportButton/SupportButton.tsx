import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { CustomButton } from "@/common/CustomButton";
import { ArrowUpRightIcon } from "@/icons";
import { useTranslations } from "next-intl";

export function SupportButton() {
  const t = useTranslations("SupportButton");

  return (
    <Grid 
      container
      gap={1.5}
    >
      <Grid container size={12} justifyContent="center">
        <Label 
          label={t("title")} 
          variantSize="regular16" 
        />
      </Grid>
      
      <CustomButton 
        onClick={() => {}}
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

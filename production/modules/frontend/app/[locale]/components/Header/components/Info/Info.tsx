import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label/Label";
import { MainBox } from "@/common/MainBox";
import { useTranslations } from "next-intl";
import { QuestionIcon, StarIcon } from "@/icons";

export const Info = () => {
  const t = useTranslations("Tasks.header");

  return (
    <Grid 
      container 
      size={12} 
      alignItems="center" 
      gap={1}
    >
      <Label 
        label="Star Season" 
        variantSize="bold18" 
      />

      <StarIcon />

      <Label 
        label={`2 ${t("subtitle")}`} 
        variantSize="regular16" 
        variantColor="gray"
      />

      <MainBox 
        style={{ marginLeft: "auto" }}
        container
        padding="4px 12px"
        gap="2px"
        bgColor="gray" 
        rounded
      >
        <Label 
          label={t("tooltip")} 
          variantSize="regular14" 
          offUserSelect
        />
				
        <QuestionIcon />
      </MainBox>
    </Grid>
  );
};

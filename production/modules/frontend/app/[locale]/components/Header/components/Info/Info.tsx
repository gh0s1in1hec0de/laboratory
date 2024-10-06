import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label/Label";
import { useTranslations } from "next-intl";
import { StarIcon } from "@/icons";
import { TicketDrawer } from "./components/TicketDrawer";

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
        label="Star Seasons" 
        variantSize="bold18" 
      />

      <StarIcon />

      <Label 
        label={`1 ${t("subtitle")}`} 
        variantSize="regular16" 
        variantColor="gray"
      />

      <TicketDrawer />
    </Grid>
  );
};

import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";
import { RewardsDrawer } from "./components/RewardsDrawer";

export function RewardsHeader() {
  const t = useTranslations("Rewards");

  return (
    <Grid 
      container
      width="100%" 
      paddingTop={2}
    >
      <Label
        label={t("title")}
        variantSize="semiBold24"
      />
      <RewardsDrawer />
    </Grid>
  );
}

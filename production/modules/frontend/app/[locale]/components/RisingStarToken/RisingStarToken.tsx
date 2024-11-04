import { Label } from "@/common/Label";
import { MainBox } from "@/common/MainBox";
import { StarClubDrawer } from "./components/StarClubDrawer";
import { RisingStarTokenCard } from "./components/DayTokenCard";
import { useTranslations } from "next-intl";
import Grid from "@mui/material/Grid2";

export function RisingStarToken() {
  const t = useTranslations("Top");
  
  return (
    <MainBox
      container
      roundedXl
      fullWidth 
      position="relative"
      minHeight="80px"
      paddingX={2}
      paddingY={1.5}
      gap={2}
      width="100%"
    >
      <StarClubDrawer />

      <Grid
        container
        size={6}
      >
        <Label
          label={t("risingStarTitle")}
          variantSize="medium16"
          offUserSelect
          cropped
        />
      </Grid>

      <RisingStarTokenCard />
    </MainBox>
  );
}

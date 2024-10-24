import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { WaveLaunchDrawer } from "./components/WaveLaunchDrawer";
import { TokensSection } from "./components/TokensSection";
import { useTranslations } from "next-intl";

export function MainContent() {
  const t = useTranslations("Top");
  return (
    <Grid 
      container 
      gap={1.5} 
      width="100%"
    >
      <Grid 
        container 
        size={12} 
        alignItems="center" 
        gap={1}
      >
        <Label 
          label={t("topTokensTitle")} 
          variantSize="semiBold24" 
        />

        <WaveLaunchDrawer />
      </Grid>

      <TokensSection />
    </Grid>
  );
}

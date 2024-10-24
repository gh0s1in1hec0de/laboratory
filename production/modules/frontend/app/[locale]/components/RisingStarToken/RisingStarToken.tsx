import { Label } from "@/common/Label";
import { MainBox } from "@/common/MainBox";
import { StarClubDrawer } from "./components/StarClubDrawer";
import { RisingStarTokenCard } from "./components/DayTokenCard";
import { useTranslations } from "next-intl";

export function RisingStarToken() {
  const t = useTranslations("Top");
  
  return (
    <MainBox
      container
      roundedXl
      fullWidth 
      position="relative"
      paddingX={2}
      paddingY={1.5}
      gap={2}
    >
      <StarClubDrawer />

      <Label
        label={t("risingStarTitle")}
        variantSize="medium16"
        offUserSelect
      />

      <RisingStarTokenCard />
    </MainBox>
  );
}

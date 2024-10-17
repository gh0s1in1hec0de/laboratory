import { Label } from "@/common/Label";
import { MainBox } from "@/common/MainBox";
import { StarClubDrawer } from "./components/StarClubDrawer";
import { DayTokenCard } from "./components/DayTokenCard";

export function DayToken() {
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
        label="🔥 Token of the day"
        variantSize="medium16"
        offUserSelect
      />

      <DayTokenCard />
    </MainBox>
  );
}

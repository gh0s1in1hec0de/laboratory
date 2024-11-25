import { CustomDrawer, DrawerParagraph } from "@/common/CustomDrawer";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import {
  DRAWER_FIRST_TEXT_DATA,
  DRAWER_FOURTH_TEXT_DATA,
  DRAWER_SECOND_TEXT_DATA,
  DRAWER_THIRD_TEXT_DATA
} from "./constants";
import { InfluencerSupportDrawerProps } from "./types";

export function InfluencerSupportDrawer({
  isOpenDrawer,
  toggleOpenDrawer
}: InfluencerSupportDrawerProps) {
  const t = useTranslations("Token.influencerSupportCheckbox.drawer");

  return (
    <CustomDrawer
      closeButtonLabel={t("closeButtonLabel")}
      isOpen={isOpenDrawer}
      onClose={toggleOpenDrawer}
      onOpen={toggleOpenDrawer}
    >
      <Grid
        container
        gap={1}
        flexDirection="column"
      >
        <DrawerParagraph data={DRAWER_FIRST_TEXT_DATA} />
        <DrawerParagraph data={DRAWER_SECOND_TEXT_DATA} />
        <DrawerParagraph data={DRAWER_THIRD_TEXT_DATA} />
        <DrawerParagraph data={DRAWER_FOURTH_TEXT_DATA} />
      </Grid>
    </CustomDrawer>
  );
}

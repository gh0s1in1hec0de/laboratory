"use client";

import { CustomDrawer, DrawerParagraph } from "@/common/CustomDrawer";
import { useToggle } from "@/hooks";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { InfoBlock } from "@/components/InfoBlock";
import { 
  DRAWER_FIRST_TEXT_DATA, 
  DRAWER_SECOND_TEXT_DATA, 
  DRAWER_THIRD_TEXT_DATA, 
  DRAWER_FOURTH_TEXT_DATA, 
  DRAWER_FIFTH_TEXT_DATA 
} from "./constants";

export function RewardsDrawer() {
  const t = useTranslations("Rewards.infoBlock");
  const [isOpenDrawer, toggleOpenDrawer] = useToggle(false);

  return (
    <>
      <InfoBlock
        onClick={toggleOpenDrawer}
        label={t("title")}
        padding="4px 12px"
        style={{ marginLeft: "auto", cursor: "pointer" }}
        rounded="xs"
      />

      <CustomDrawer
        closeButtonLabel={t("closeButton")}
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
          <DrawerParagraph 
            data={DRAWER_THIRD_TEXT_DATA} 
            inBox 
            paddingTop={1} 
            paddingBottom={1}
          />
          <DrawerParagraph data={DRAWER_FOURTH_TEXT_DATA} />
          <DrawerParagraph data={DRAWER_FIFTH_TEXT_DATA} />
        </Grid>
      </CustomDrawer>
    </>
  );
}

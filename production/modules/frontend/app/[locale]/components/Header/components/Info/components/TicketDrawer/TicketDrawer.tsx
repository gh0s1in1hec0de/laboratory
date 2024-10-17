"use client";

import { 
  DRAWER_FIFTH_TEXT_DATA, 
  DRAWER_FIRST_TEXT_DATA, 
  DRAWER_FOURTH_TEXT_DATA, 
  DRAWER_SECOND_TEXT_DATA, 
  DRAWER_SIXTH_TEXT_DATA, 
  DRAWER_THIRD_TEXT_DATA 
} from "./constants";
import { CustomDrawer } from "@/common/CustomDrawer";
import { Label } from "@/common/Label";
import { MainBox } from "@/common/MainBox";
import { useToggle } from "@/hooks";
import { QuestionIcon } from "@/icons";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { DrawerParagraph } from "./components/DrawerParagraph";
import { InfoBlock } from "@/components/InfoBlock";

export function TicketDrawer() {
  const t = useTranslations("Tasks.header");
  const [isOpenDrawer, toggleOpenDrawer] = useToggle(false);

  return (
    <>
      <InfoBlock
        onClick={toggleOpenDrawer}
        label={t("tooltip")}
        padding="4px 12px"
        style={{ marginLeft: "auto", cursor: "pointer" }}
        rounded
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
          <DrawerParagraph data={DRAWER_THIRD_TEXT_DATA} />
          <DrawerParagraph data={DRAWER_FOURTH_TEXT_DATA} inBox />
          <DrawerParagraph data={DRAWER_FIFTH_TEXT_DATA} />
          <DrawerParagraph data={DRAWER_SIXTH_TEXT_DATA} highlightColor="gray" />
        </Grid>
      </CustomDrawer>
    </>
  );
}

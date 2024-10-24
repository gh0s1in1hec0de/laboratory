"use client";

import {
  DRAWER_FIRST_TEXT_DATA,
  DRAWER_SECOND_TEXT_DATA,
  DRAWER_FIRST_LIST_DATA,
  DRAWER_SECOND_LIST_DATA,
  DRAWER_THIRD_LIST_DATA,
  DRAWER_THIRD_TEXT_DATA,
  DRAWER_FOURTH_LIST_DATA,
  DRAWER_FIFTH_LIST_DATA,
  DRAWER_SIXTH_LIST_DATA,
  DRAWER_SEVENTH_LIST_DATA,
} from "./constants";
import { InfoBlock } from "@/components/InfoBlock";
import { CustomDrawer, DrawerParagraph, DrawerList } from "@/common/CustomDrawer";
import { useToggle } from "@/hooks";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { SupportButton } from "@/components/SupportButton";

export function WaveLaunchDrawer() {
  const t = useTranslations("Top");
  const [isOpenDrawer, toggleOpenDrawer] = useToggle(false);

  return (
    <>
      <InfoBlock
        onClick={toggleOpenDrawer}
        label={t("waveLaunchButton")}
        padding="4px 12px"
        style={{ marginLeft: "auto", cursor: "pointer" }}
        rounded
      />

      <CustomDrawer
        customCloseButton={<SupportButton />}
        isOpen={isOpenDrawer}
        onClose={toggleOpenDrawer}
        onOpen={toggleOpenDrawer}
      >
        <Grid
          container
          gap={1}
          flexDirection="column"
        >
          <DrawerParagraph 
            data={DRAWER_FIRST_TEXT_DATA}
            highlightColor="orange"
          />
          <DrawerParagraph data={DRAWER_SECOND_TEXT_DATA} />
          <DrawerList 
            paddingTop={2}
            data={DRAWER_FIRST_LIST_DATA} 
            variant="circle"
            index={1}
          />
          <DrawerList 
            paddingTop={1}
            data={DRAWER_SECOND_LIST_DATA} 
            variant="circle"
            index={2}
          />
          <DrawerList 
            paddingTop={1}
            data={DRAWER_THIRD_LIST_DATA} 
            variant="circle"
            index={3}
          />
          <DrawerParagraph
            data={DRAWER_THIRD_TEXT_DATA} 
            paddingTop={2}
          />
          <DrawerList data={DRAWER_FOURTH_LIST_DATA} />
          <DrawerList data={DRAWER_FIFTH_LIST_DATA} />
          <DrawerList data={DRAWER_SIXTH_LIST_DATA} />
          <DrawerList data={DRAWER_SEVENTH_LIST_DATA} />
        </Grid>
      </CustomDrawer>
    </>
  );
}

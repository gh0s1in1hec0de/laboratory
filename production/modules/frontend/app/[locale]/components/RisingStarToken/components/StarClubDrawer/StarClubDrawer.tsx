import { CustomDrawer, DrawerList, DrawerParagraph } from "@/common/CustomDrawer";
import { InfoBlock } from "@/components/InfoBlock";
import { SupportButton } from "@/components/SupportButton";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { MouseEvent } from "react";
import {
  DRAWER_FIRST_LIST_DATA,
  DRAWER_FIRST_TEXT_DATA,
  DRAWER_FOURTH_TEXT_DATA,
  DRAWER_SECOND_LIST_DATA,
  DRAWER_SECOND_TEXT_DATA,
  DRAWER_THIRD_LIST_DATA,
  DRAWER_THIRD_TEXT_DATA,
} from "./constants";
import { StarClubDrawerProps } from "./types";

export function StarClubDrawer({
  isOpenDrawer,
  toggleOpenDrawer,
}: StarClubDrawerProps) {
  const t = useTranslations("Top");

  function handleOpenDrawer(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
    toggleOpenDrawer();
  }

  return (
    <>
      <InfoBlock
        onClick={handleOpenDrawer}
        label={t("starClubButton")}
        position="absolute"
        top="0"
        right="0"
        padding={1.5}
        style={{
          cursor: "pointer",
          borderTopRightRadius: "27px",
          borderBottomLeftRadius: "28px",
        }}
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
          <DrawerParagraph data={DRAWER_FIRST_TEXT_DATA} highlightColor="orange" />
          <DrawerParagraph data={DRAWER_SECOND_TEXT_DATA} />
          <DrawerParagraph data={DRAWER_THIRD_TEXT_DATA} />
          <DrawerParagraph data={DRAWER_FOURTH_TEXT_DATA} paddingTop={2} />
          <DrawerList data={DRAWER_FIRST_LIST_DATA} />
          <DrawerList data={DRAWER_SECOND_LIST_DATA} />
          <DrawerList data={DRAWER_THIRD_LIST_DATA} />
        </Grid>
      </CustomDrawer>
    </>
  );
}

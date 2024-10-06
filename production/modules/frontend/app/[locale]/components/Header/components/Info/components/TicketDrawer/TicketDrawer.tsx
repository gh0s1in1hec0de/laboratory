"use client";

import { CustomDrawer } from "@/common/CustomDrawer";
import { Label } from "@/common/Label";
import { MainBox } from "@/common/MainBox";
import { QuestionIcon } from "@/icons";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { useState, KeyboardEvent, MouseEvent } from "react";
import { DrawerParagraph } from "./components/DrawerParagraph";
import { DRAWER_FIFTH_TEXT_DATA, DRAWER_FIRST_TEXT_DATA, DRAWER_FOURTH_TEXT_DATA, DRAWER_SECOND_TEXT_DATA, DRAWER_SIXTH_TEXT_DATA, DRAWER_THIRD_TEXT_DATA } from "./constants";

export function TicketDrawer() {
  const t = useTranslations("Tasks.header");
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);

  function onClickOpenDrawerHandler() {
    setIsOpenDrawer(true);
  }

  function onClickCloseDrawerHandler() {
    setIsOpenDrawer(false);
  }

  function toggleDrawer(open: boolean) {
    return (event: KeyboardEvent | MouseEvent) => {
      if (
        event &&
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }

      setIsOpenDrawer(open);
    };
  }
  
  return (
    <>
      <MainBox 
        style={{ marginLeft: "auto", cursor: "pointer" }}
        container
        padding="4px 12px"
        alignItems="center"
        gap="2px"
        bgColor="gray" 
        rounded
        onClick={onClickOpenDrawerHandler}
      >
        <Label 
          label={t("tooltip")} 
          variantSize="regular14" 
          offUserSelect
        />
        <QuestionIcon />
      </MainBox>
      
      <CustomDrawer
        isOpen={isOpenDrawer}
        onClose={onClickCloseDrawerHandler}
        onOpen={onClickOpenDrawerHandler}
      >
        <Grid 
          container 
          gap={1} 
          flexDirection="column"
        >
          <DrawerParagraph data={DRAWER_FIRST_TEXT_DATA} />
          <DrawerParagraph data={DRAWER_SECOND_TEXT_DATA} />
          <DrawerParagraph data={DRAWER_THIRD_TEXT_DATA} />
          <DrawerParagraph data={DRAWER_FOURTH_TEXT_DATA} inBox/>
          <DrawerParagraph data={DRAWER_FIFTH_TEXT_DATA} />
          <DrawerParagraph data={DRAWER_SIXTH_TEXT_DATA} highlightColor="gray" />
        </Grid>
      </CustomDrawer>
    </>
  );
}

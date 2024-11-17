import { 
  DRAWER_FIRST_TEXT_DATA, 
  DRAWER_FOURTH_TEXT_DATA, 
  DRAWER_SECOND_TEXT_DATA, 
  DRAWER_THIRD_TEXT_DATA, 
  DRAWER_FIRST_LIST_DATA,
  DRAWER_SECOND_LIST_DATA,
  DRAWER_THIRD_LIST_DATA,
} from "./constants";
import { CustomDrawer, DrawerList, DrawerParagraph } from "@/common/CustomDrawer";
import { useToggle } from "@/hooks";
import Grid from "@mui/material/Grid2";
import { InfoBlock } from "@/components/InfoBlock";
import { useTranslations } from "next-intl";
import { SupportButton } from "@/components/SupportButton";
import { MouseEvent } from "react";

export function StarClubDrawer() {
  const t = useTranslations("Top");
  const [isOpenDrawer, toggleOpenDrawer] = useToggle(false);
  
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
          borderTopRightRadius: "28px", 
          borderBottomLeftRadius: "28px" 
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
          <DrawerParagraph data={DRAWER_FOURTH_TEXT_DATA} paddingTop={2}/>
          <DrawerList data={DRAWER_FIRST_LIST_DATA} />
          <DrawerList data={DRAWER_SECOND_LIST_DATA} />
          <DrawerList data={DRAWER_THIRD_LIST_DATA} />
        </Grid>
      </CustomDrawer>
    </>
  );
}

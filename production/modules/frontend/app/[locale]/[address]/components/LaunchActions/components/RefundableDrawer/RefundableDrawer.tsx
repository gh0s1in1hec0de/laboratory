import { CustomDrawer, DrawerParagraph } from "@/common/CustomDrawer";
import { InfoBlock } from "@/components/InfoBlock";
import Grid from "@mui/material/Grid2";
import { useToggle } from "@/hooks";
import { useTranslations } from "next-intl";
import { SupportButton } from "@/components/SupportButton";
import { DRAWER_FIRST_TEXT_DATA, DRAWER_FOURTH_TEXT_DATA, DRAWER_SECOND_TEXT_DATA, DRAWER_THIRD_TEXT_DATA, DRAWER_FIFTH_TEXT_DATA } from "./constants";

export function RefundableDrawer() {
  const t = useTranslations("CurrentLaunch.refundableDrawer");
  const [isOpenDrawer, toggleOpenDrawer] = useToggle(false);

  return (
    <>
      <InfoBlock
        onClick={toggleOpenDrawer}
        label={t("tooltip")}
        padding="4px 12px"
        style={{ marginLeft: "auto", cursor: "pointer" }}
        rounded="xs"
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
          <DrawerParagraph data={DRAWER_FIRST_TEXT_DATA} />
          <DrawerParagraph data={DRAWER_SECOND_TEXT_DATA} />
          <DrawerParagraph data={DRAWER_THIRD_TEXT_DATA} />
          <DrawerParagraph 
            data={DRAWER_FOURTH_TEXT_DATA} 
            inBox 
            paddingTop={1} 
            paddingBottom={1}
          />
          <DrawerParagraph data={DRAWER_FIFTH_TEXT_DATA} highlightColor="gray" />
        </Grid>
      </CustomDrawer>
    </>
  );
}

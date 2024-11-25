import { CustomDrawer, DrawerList, DrawerParagraph } from "@/common/CustomDrawer";
import { SupportButton } from "@/components/SupportButton";
import Grid from "@mui/material/Grid2";
import {
  DRAWER_FIRST_LIST_DATA,
  DRAWER_FIRST_TEXT_DATA,
  DRAWER_FOURTH_TEXT_DATA,
  DRAWER_SECOND_TEXT_DATA,
  DRAWER_THIRD_TEXT_DATA
} from "./constants";
import { MarketingSupportDrawerProps } from "./types";

export function MarketingSupportDrawer({ 
  isOpenDrawer, 
  toggleOpenDrawer 
}: MarketingSupportDrawerProps){
  return(
    <CustomDrawer
      customCloseButton={<SupportButton withLabel={false} />}
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
        <DrawerParagraph data={DRAWER_SECOND_TEXT_DATA}/>
        <DrawerParagraph data={DRAWER_THIRD_TEXT_DATA}/>
        <DrawerList 
          paddingTop={2}
          data={DRAWER_FIRST_LIST_DATA} 
        />
        <DrawerParagraph data={DRAWER_FOURTH_TEXT_DATA}/>
      </Grid>
    </CustomDrawer>
  );
}

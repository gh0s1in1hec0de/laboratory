import { CustomDrawer, DrawerList, DrawerParagraph } from "@/common/CustomDrawer";
import Grid from "@mui/material/Grid2";
import { ApproveButtons } from "./components/ApproveButtons";
import {
  DRAWER_FIRST_TEXT_DATA,
  DRAWER_SECOND_TEXT_DATA,
  DRAWER_FIRST_LIST_DATA,
  DRAWER_SECOND_LIST_DATA,
} from "./constants";
import { RefundDrawerProps } from "./types";

export function RefundDrawer({
  isOpenDrawer,
  toggleOpenDrawer,
  onClickRefund,
}: RefundDrawerProps) {
  return (
    <CustomDrawer
      customCloseButton={(
        <ApproveButtons
          onClickRefund={onClickRefund}
          toggleOpenDrawer={toggleOpenDrawer}
        />
      )}
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
        <DrawerList data={DRAWER_FIRST_LIST_DATA} />
        <DrawerList data={DRAWER_SECOND_LIST_DATA} />
      </Grid>
    </CustomDrawer>
  );
}

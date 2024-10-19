"use client";

import { CustomDrawer } from "@/common/CustomDrawer";
import { useToggle } from "@/hooks";
import Grid from "@mui/material/Grid2";
import { InfoBlock } from "@/components/InfoBlock";

export function StarClubDrawer() {
  const [isOpenDrawer, toggleOpenDrawer] = useToggle(false);
  
  return (
    <>
      <InfoBlock 
        onClick={toggleOpenDrawer}
        label="Star Club"
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
        closeButtonLabel={"Закрыть"}
        isOpen={isOpenDrawer}
        onClose={toggleOpenDrawer}
        onOpen={toggleOpenDrawer}
      >
        <Grid
          container
          gap={1}
          flexDirection="column"
        >
          123
        </Grid>
      </CustomDrawer>
    </>
  );
}

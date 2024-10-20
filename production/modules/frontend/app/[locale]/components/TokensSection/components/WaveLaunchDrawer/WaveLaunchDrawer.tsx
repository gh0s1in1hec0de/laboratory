"use client";

import { InfoBlock } from "@/components/InfoBlock";
import { CustomDrawer } from "@/common/CustomDrawer";
import { useToggle } from "@/hooks";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";

export function WaveLaunchDrawer() {
  const t = useTranslations("");
  const [isOpenDrawer, toggleOpenDrawer] = useToggle(false);

  return (
    <>
      <InfoBlock
        onClick={toggleOpenDrawer}
        label={"Wave Launch"}
        padding="4px 12px"
        style={{ marginLeft: "auto", cursor: "pointer" }}
        rounded
      />

      <CustomDrawer
        closeButtonLabel={"Close"}
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

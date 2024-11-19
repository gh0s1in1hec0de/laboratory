"use client";

import { CustomDrawer } from "@/common/CustomDrawer";
import { useToggle } from "@/hooks";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { InfoBlock } from "@/components/InfoBlock";

export function RewardsDrawer() {
  const t = useTranslations("Rewards.infoBlock");
  const [isOpenDrawer, toggleOpenDrawer] = useToggle(false);

  return (
    <>
      <InfoBlock
        onClick={toggleOpenDrawer}
        label={t("title")}
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
          123
        </Grid>
      </CustomDrawer>
    </>
  );
}

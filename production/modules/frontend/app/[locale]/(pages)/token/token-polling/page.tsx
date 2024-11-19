"use client";

import Grid from "@mui/material/Grid2";
import { Polling } from "./components/Polling";
import { useTokenPolling } from "./hooks/useTokenPolling";
import { CurrentToken } from "./components/CurrentToken";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";

export default function TokenPolling() {
  const t = useTranslations("Token.polling");
  const {
    launchData,
    isLoading,
    isLaunchCreated
  } = useTokenPolling();

  return (
    <Grid
      container
      width="100%"
    >
      {isLoading ? <Polling isLaunchCreated={isLaunchCreated} /> : 
        launchData ? <CurrentToken launchData={launchData} /> :
          <Label label={t("noLaunchData")} />
      }
    </Grid>
  );
}

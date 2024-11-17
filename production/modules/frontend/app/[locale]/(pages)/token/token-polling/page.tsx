"use client";

import Grid from "@mui/material/Grid2";
import { Polling } from "./components/Polling";
import { useTokenPolling } from "./hooks/useTokenPolling";
import { CurrentToken } from "./components/CurrentToken";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";

export default function TokenPolling() {
  const {
    launchData,
    isLoading,
    isLaunchCreated
  } = useTokenPolling();
  const t = useTranslations("Token.polling");

  return (
    <Grid
      container
      width="100%"
    >
      {/* todo delete this */}
      {/* <CurrentToken launchData={launchData} /> */}
      {isLoading ? <Polling isLaunchCreated={isLaunchCreated} /> : 
        launchData ? <CurrentToken launchData={launchData} /> :
          <Label label={t("noLaunchData")} />
      }
    </Grid>
  );
}

"use client";

import Grid from "@mui/material/Grid2";
import { Polling } from "./components/Polling";
import { useTokenPolling } from "./hooks/useTokenPolling";
import { CurrentToken } from "./components/CurrentToken";
import { Label } from "@/common/Label";

export default function TokenPolling() {
  const {
    launchData,
    isLoading,
  } = useTokenPolling();

  return (
    <Grid
      container
      width="100%"
    >
      <CurrentToken launchData={launchData} />
      {/* {isLoading ? <Polling /> : 
        launchData ? <CurrentToken launchData={launchData} /> :
          <Label label="No launch data" />
      } */}
    </Grid>
  );
}

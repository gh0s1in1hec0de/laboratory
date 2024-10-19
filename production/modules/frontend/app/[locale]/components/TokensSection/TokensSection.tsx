"use client";

import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { WaveLaunchDrawer } from "./components/WaveLaunchDrawer";
import { TokensList } from "./components/TokensList";

export function TokensSection() {
  return (
    <Grid 
      container 
      gap={1.5} 
      width="100%"
    >
      <Grid 
        container 
        size={12} 
        alignItems="center" 
        gap={1}
      >
        <Label 
          label="Top Tokens" 
          variantSize="semiBold24" 
        />

        <WaveLaunchDrawer />
      </Grid>

      <TokensList />
    </Grid>
  );
}

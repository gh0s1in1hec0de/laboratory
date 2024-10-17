import Grid from "@mui/material/Grid2";
import { Info } from "./components/Info";
import { TicketBalance } from "./components/TicketBalance";
import { BgLight } from "@/common/BgLight";
import { TonProvider } from "@/providers/ton";
import { CustomConnectButton } from "@/components/CustomConnectButton";

export function Header() {
  return (
    <Grid 
      container 
      position="relative" 
      gap={2}
      width="100%"
    >
      <BgLight />

      <Info />

      <TonProvider>
        <CustomConnectButton 
          successChildren={<TicketBalance />}
          fullWidth
        />
      </TonProvider>
    </Grid>
  );
}

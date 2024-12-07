import Grid from "@mui/material/Grid2";
import { Info } from "./components/Info";
import { TicketBalance } from "./components/TicketBalance";
import { BgLight } from "@/common/BgLight";
import { TonProvider } from "@/providers/ton";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { LangSwitcher } from "@/components/LangSwitcher";

export function Header() {
  return (
    <Grid 
      container 
      position="relative" 
      gap={2}
      width="100%"
    >
      <BgLight />

      <TonProvider>
        <LangSwitcher />
      </TonProvider>

      <Info />

      <TonProvider>
        <CustomConnectButton 
          successChildren={<TicketBalance rounded="xs" />}
          fullWidth
          copyReferralButton
        />
      </TonProvider>
    </Grid>
  );
}

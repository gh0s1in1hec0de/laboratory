import Grid from "@mui/material/Grid2";
import { Info } from "./components/Info";
import { useTranslations } from "next-intl";
import { TicketBalance } from "./components/TicketBalance";
import { BgLight } from "@/common/BgLight";
import { TonProvider } from "@/providers/ton";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { LangSwitcher } from "@/components/LangSwitcher";

export function Header() {
  const t = useTranslations("Quests.header");

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
          title={t("connectWallet")}
          disconnectLabel={t("disconnectWallet")}
          successChildren={<TicketBalance />}
        />
      </TonProvider>
    </Grid>
  );
}

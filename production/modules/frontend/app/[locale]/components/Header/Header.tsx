import Grid from "@mui/material/Grid2";
import { Info } from "./components/Info";
import { useTranslations } from "next-intl";
import { TicketBalance } from "./components/TicketBalance";
import { BgLight } from "@/common/BgLight";
import { LanguageSwitcherWithTon } from "@/components/LanguageSwitcherWithTon";
import { TonConnectProvider } from "@/common/TonConnectProvider";
import { CustomConnectButton } from "@/components/CustomConnectButton";

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
      <LanguageSwitcherWithTon />

      <Info />

      <TonConnectProvider>
        <CustomConnectButton 
          title={t("connectWallet")}
          successChildren={<TicketBalance />}
        />
      </TonConnectProvider>
    </Grid>
  );
}

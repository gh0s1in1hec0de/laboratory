import { BgLight } from "@/common/BgLight";
import { LaunchHeader } from "@/components/LaunchHeader";
import { LaunchTimer } from "@/components/LaunchTimer";
import Grid from "@mui/material/Grid2";
import { getCurrentSalePhase } from "starton-periphery";
import { TokenBody } from "./components/TokenBody";
import { CurrentTokenProps } from "./types";
import { TonProvider } from "@/providers/ton";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function CurrentToken({ launchData }: CurrentTokenProps) {
  const t = useTranslations("Token.currentToken");
  const router = useRouter();

  useEffect(() => {
    router.refresh();
  }, []);

  return (
    <Grid
      container
      flexDirection="column"
      alignItems="center"
      width="100%"
      gap={2}
    >
      <BgLight />

      {launchData && (
        <>
          <LaunchHeader
            avatarSrc={launchData.metadata.image}
            symbol={launchData.metadata.symbol}
            name={launchData.metadata.name}
          />

          <TonProvider>
            <TokenBody
              supply={launchData.totalSupply}
              symbol={launchData.metadata.symbol}
              launchAddress={launchData.address}
              timings={launchData.timings}
              version={launchData.version}
            />
          </TonProvider>

          <Grid 
            container
            flexDirection="column"
            alignItems="center"
            gap={1}
          >
            <Label
              label={t("timerTitle")}
              variantSize="regular16"    
            />

            <LaunchTimer
              initialSeconds={getCurrentSalePhase(launchData.timings).nextPhaseIn || 0}
            />
          </Grid>
        </>
      )}
    </Grid>
  );
}

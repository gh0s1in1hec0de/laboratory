import { BgLight } from "@/common/BgLight";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { LangSwitcher } from "@/components/LangSwitcher";
import { TonProvider } from "@/providers/ton";
import Grid from "@mui/material/Grid2";
import { RedirectButtons } from "./components/RedirectButtons";

export default function Profile() {
  return (
    <Grid
      container
      width="100%"
      gap={1.5}
      paddingTop={2}
    >
      <BgLight />

      <TonProvider>
        <LangSwitcher />
      </TonProvider>


      <TonProvider>
        <CustomConnectButton
          successChildren={<RedirectButtons />}
          fullWidth
        />
      </TonProvider>
    </Grid>
  );
}

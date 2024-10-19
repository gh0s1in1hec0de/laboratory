import { Label } from "@/common/Label";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { TonProvider } from "@/providers/ton";
import Grid from "@mui/material/Grid2";

export function Header() {
  return (
    <Grid
      container
      justifyContent="space-between"
      alignItems="center"
      width="100%"
    >
      <Label
        variantSize="semiBold24"
        label="Hello 👋"
      />
      
      <TonProvider>
        <CustomConnectButton />
      </TonProvider>
    </Grid>
  );
}

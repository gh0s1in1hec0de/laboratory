import Grid from "@mui/material/Grid2";
import { CreateTokenForm } from "./components/CreateTokenForm";
import { TonProvider } from "@/providers/ton";

export default function Token() {
  return (
    <Grid
      container
      width="100%"
    >
      <TonProvider>
        <CreateTokenForm />
      </TonProvider>
    </Grid>
  );
}

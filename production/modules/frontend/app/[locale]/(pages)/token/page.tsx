import Grid from "@mui/material/Grid2";
import { CreateTokenForm } from "./components/CreateTokenForm";

export default function Token() {
  return (
    <Grid
      container
      width="100%"
    >
      <CreateTokenForm />
    </Grid>
  );
}

import Grid from "@mui/material/Grid2";
import { Header } from "./components/Header";
import { DayToken } from "./components/DayToken";

export default function Home() {

  return (
    <Grid
      container
      gap={2}
      paddingTop={1}
      // position="relative"
    >
      <Header />
      <DayToken />
    </Grid>
  );
}

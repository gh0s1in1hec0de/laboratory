import Grid from "@mui/material/Grid2";
import { Header } from "./components/Header";
import { DayToken } from "./components/DayToken";
import { TokensSection } from "./components/TokensSection";

export default function Home() {
  return (
    <Grid
      container
      gap={2}
      paddingTop={1}
    >
      <Header />
      <DayToken />
      <TokensSection />
    </Grid>
  );
}

import Grid from "@mui/material/Grid2";
import { Header } from "./components/Header";
import { RisingStarToken } from "./components/RisingStarToken";
import { MainContent } from "./components/MainContent";

export default function Home() {
  return (
    <Grid
      container
      gap={2}
      paddingTop={1}
    >
      <Header />
      <RisingStarToken />
      <MainContent />
    </Grid>
  );
}

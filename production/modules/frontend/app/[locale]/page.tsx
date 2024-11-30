import Grid from "@mui/material/Grid2";
import { Header } from "./components/Header";
import { Tasks } from "./components/Tasks";

export default function Home() {
  return (
    <Grid 
      container
      gap={2}
      paddingTop={2}
      position="relative"
      width="100%"
    >
      <Header />
      <Tasks />
    </Grid>
  );
}

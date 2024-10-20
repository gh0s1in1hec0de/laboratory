import Grid from "@mui/material/Grid2";
import { Header } from "./components/Header";
import { Tasks } from "./components/Tasks";

export default function Quests() {
  return (
    <Grid 
      container
      gap={2}
      paddingTop={2}
      position="relative"
    >
      <Header />
      <Tasks />
    </Grid>
  );
}

import Grid from "@mui/material/Grid2";
import { Header } from "./components/Header";
import { TasksList } from "./components/TasksList";

export default function Quests() {
  return (
    <Grid 
      container
      gap={2}
      paddingTop={2}
      position="relative"
    >
      <Header />
      
      <TasksList />
    </Grid>
  );
}

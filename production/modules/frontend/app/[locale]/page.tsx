import Grid from "@mui/material/Grid2";
import { Header } from "./components/Header";
import { QuestsList } from "./components/QuestsList";

export default function Quests() {
  return (
    <Grid 
      container
      gap={2}
      paddingTop={2}
      position="relative"
    >
      <Header />
      
      <QuestsList />
    </Grid>
  );
}

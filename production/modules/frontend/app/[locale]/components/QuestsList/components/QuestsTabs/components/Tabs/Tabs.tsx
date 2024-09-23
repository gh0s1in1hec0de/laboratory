import { TabPanel , Disclosure } from "@headlessui/react";
import Grid from "@mui/material/Grid2";
import { TabContentProps } from "./types";
import { QuestCard } from "./components/QuestCard";

export function Tabs({ quests, index }: TabContentProps) {
  return(
    <TabPanel style={{ outline: "none" }}>
      <Grid container gap={1}>
        {quests.map((quest, questIndex) => (
          <Disclosure key={questIndex}>
            {({ open }) => (
              <QuestCard 
                quest={quest} 
                disabled={index === 1}
                open={open}
              />
            )}
          </Disclosure>
        ))}
      </Grid>
    </TabPanel>
  );
}

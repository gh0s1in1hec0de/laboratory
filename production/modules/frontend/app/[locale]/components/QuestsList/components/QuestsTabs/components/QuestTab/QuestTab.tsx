import { Disclosure, TabPanel } from "@headlessui/react";
import Grid from "@mui/material/Grid2";
import { QuestCard } from "./components/QuestCard";
import { QuestTabProps } from "./types";

export function QuestTab({ content, index }: QuestTabProps) {
  return (
    <TabPanel style={{ outline: "none" }}>
      <Grid container gap={1}>
        {content?.map((quest, questIndex) => (
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

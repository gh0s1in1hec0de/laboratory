"use client";

import { TabGroup, TabList, TabPanels } from "@headlessui/react";
import Grid from "@mui/material/Grid2";
import { useState } from "react";
import { Tabs } from "./components/Tabs";
import { TabLabel } from "./components/TabLabel";
import styles from "./QuestsTabs.module.scss";
import { QuestsTabsProps } from "./types";

export function QuestsTabs({ tabs }: QuestsTabsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <TabGroup style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <TabList className={styles.bg}>
        <Grid container gap={1}>
          {tabs.map((tab, index) => (
            <TabLabel
              key={index}
              label={tab.label}
              setSelectedIndex={setSelectedIndex}
            />
          ))}
        </Grid>
      </TabList>

      <TabPanels>
        {tabs.map((tab, index) => (
          <Tabs 
            key={index} 
            quests={tab.quests} 
            index={index}
          />
        ))}
      </TabPanels>
    </TabGroup>
  );
}

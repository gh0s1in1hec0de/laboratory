"use client";

import { QuestsTabsProps } from "./types";
import { CustomTabs } from "@/common/CustomTabs";
import { QuestTab } from "./components/QuestTab";

export function QuestsTabs({ tabs }: QuestsTabsProps) {
  
  return (
    <CustomTabs 
      tabLabels={tabs.map((tab) => tab.label)}
    >
      {tabs.map((tab, index) => (
        <QuestTab 
          key={index} 
          content={tab.content} 
          index={index}
        />
      ))}
    </CustomTabs>
  );
}

"use client";

import Grid from "@mui/material/Grid2";
import { CustomTabs } from "@/common/CustomTabs";
import { TasksList } from "./components/TasksList";
import { useState } from "react";
import { TasksTabsValues } from "./types";
import { useTasks } from "./hooks/useTasks";
import { TASKS_TABS } from "./constants";

export function TasksContent() {
  const [selectedTab, setSelectedTab] = useState<TasksTabsValues>(TasksTabsValues.NEW);
  const { 
    tasks, 
    isLoading, 
    error 
  } = useTasks({ selectedTab });

  return (
    <Grid 
      container
      flexDirection="column"
      gap={2}
      width="100%"
    >
      <CustomTabs 
        selectedTab={selectedTab}
        onChange={setSelectedTab}
        disabled={isLoading}
        tabs={TASKS_TABS}
      />

      <TasksList 
        tasks={tasks}
        isLoading={isLoading}
        error={error}
      />
    </Grid>
  );
}

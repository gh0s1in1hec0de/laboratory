"use client";

import Grid from "@mui/material/Grid2";
import { TasksTabs } from "./components/TasksTabs";
import { TasksList } from "./components/TasksList";
import { useState } from "react";
import { TasksTabsValues } from "./types";
import { useTasks } from "./hooks/useTasks";

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
      <TasksTabs 
        selectedTab={selectedTab}
        onChange={setSelectedTab}
        disabled={isLoading}
      />

      <TasksList 
        tasks={tasks}
        isLoading={isLoading}
        error={error}
      />
    </Grid>
  );
}

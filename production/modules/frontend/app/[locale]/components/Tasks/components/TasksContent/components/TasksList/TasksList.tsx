import { LoadingWrapper } from "@/common/LoadingWrapper";
import { Disclosure } from "@headlessui/react";
import Grid from "@mui/material/Grid2";
import { QuestCard } from "./components/QuestTab/components/QuestCard";
import { TasksListSkeleton } from "./components/TasksListSkeleton";
import { TasksListProps } from "./types";

export function TasksList({ 
  tasks, 
  isLoading, 
  error 
}: TasksListProps) {

  return (
    <LoadingWrapper 
      isLoading={isLoading}
      skeleton={<TasksListSkeleton />}
    >
      {tasks.length === 0 ? (
        <div>No tasks found</div>
      ) : tasks.map((task, index) => (
        <Grid container gap={1} key={task.taskId}>
          <Disclosure>
            {({ open }) => (
              <QuestCard
                task={task}
                disabled={task.completed}
                open={open}
              />
            )}
          </Disclosure>
        </Grid>
      ))}
    </LoadingWrapper>
  );
}

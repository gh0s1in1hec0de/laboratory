import { LoadingWrapper } from "@/common/LoadingWrapper";
import Grid from "@mui/material/Grid2";
import { TasksListSkeleton } from "./components/TasksListSkeleton";
import { TasksListProps } from "./types";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";
import { TaskCard } from "./components/TaskCard";

export function TasksList({ 
  tasks, 
  isLoading, 
  error 
}: TasksListProps) {
  const t = useTranslations("Tasks.content");

  if (error) {
    return (
      <Label 
        label={t("error")} 
        variantColor="red" 
        variantSize="medium16" 
        textAlign="center" 
      />
    );
  }

  return (
    <LoadingWrapper 
      isLoading={isLoading}
      skeleton={<TasksListSkeleton />}
    >
      <Grid 
        container 
        gap={0.75} 
        justifyContent="center"
        width="100%"
      >
        {tasks.length === 0 ? (
          <Label
            label={t("noTasksFound")}
            variantColor="white"
            variantSize="medium16"
            textAlign="center"
            offUserSelect
          />
        ) : tasks.map((task) => (
          <TaskCard
            key={task.taskId}
            task={task}
          />
        ))}
      </Grid>
    </LoadingWrapper>
  );
}

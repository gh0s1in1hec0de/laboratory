import { Subtask } from "@/types";

export interface SubTasksProps {
  subTasks: Subtask[];
  open: boolean;
  disabled: boolean;
}

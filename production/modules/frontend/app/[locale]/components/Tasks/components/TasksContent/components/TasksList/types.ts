import { Task } from "@/types";

export interface TasksListProps {
  tasks: Task[];
  isLoading: boolean;
  error: string;
}


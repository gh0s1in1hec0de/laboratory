import { Task } from "@/types";

export interface Tab<T> {
  label: string;
  content?: T[];
}

export interface QuestTabProps {
  task: Task;
  index: number;
}

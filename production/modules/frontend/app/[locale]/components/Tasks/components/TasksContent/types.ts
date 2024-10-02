export enum TasksTabsValues {
  NEW = "new",
  STAGED = "staged",
}

export interface TasksTab {
  label: string;
  value: TasksTabsValues;
}

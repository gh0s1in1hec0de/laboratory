import { TasksTabsValues } from "../../types";

export interface TasksTabsProps {
  selectedTab: TasksTabsValues;
  onChange: (tab: TasksTabsValues) => void;
  disabled: boolean;
}

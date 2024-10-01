export interface Subtask {
  name: string;
  description: string;
}

export interface Task {
  taskId: number;
  name: string;
  description: Subtask[];
  rewardTickets: number;
  staged: boolean;
  completed: boolean;
}

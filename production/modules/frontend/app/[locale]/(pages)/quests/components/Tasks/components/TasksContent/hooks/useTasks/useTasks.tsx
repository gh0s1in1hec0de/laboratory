import { userService } from "@/services";
import { Task } from "@/types";
import { useEffect, useState, useCallback } from "react";
import { UseTasksProps } from "./types";
import { TasksTabsValues } from "../../types";
import { useIsConnectionRestored, useTonConnectUI } from "@tonconnect/ui-react";
import { CALLER_ADDRESS } from "@/constants";
import { localStorageWrapper } from "@/utils";

export function useTasks({ selectedTab }: UseTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tonConnectUI] = useTonConnectUI();
  const connectionRestored = useIsConnectionRestored();

  const fetchTasks = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const tasks = await userService.getTasks(selectedTab === TasksTabsValues.STAGED);
      setTasks(tasks);
    } catch (error) {
      setError("Error fetching tasks");
    } finally {
      setIsLoading(false);
    }
  }, [selectedTab]);

  useEffect(() => {
    fetchTasks();

    const unsubscribe = tonConnectUI.onStatusChange(async (wallet) => {
      if (wallet) {
        localStorageWrapper.set(CALLER_ADDRESS, wallet.account.address);
        await fetchTasks();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tonConnectUI, fetchTasks]);

  return {
    isLoading: isLoading || !connectionRestored,
    tasks,
    error,
  };
}

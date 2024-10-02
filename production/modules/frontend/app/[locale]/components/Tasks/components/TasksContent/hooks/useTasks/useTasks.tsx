import { userService } from "@/services";
import { Task } from "@/types";
import { useEffect, useState } from "react";
import { UseTasksProps } from "./types";
import { TasksTabsValues } from "../../types";
import { useIsConnectionRestored, useTonConnectUI } from "@tonconnect/ui-react";
import { localStorageWrapper } from "@/utils";

export function useTasks({ selectedTab }: UseTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [tonConnectUI] = useTonConnectUI();
  const connectionRestored = useIsConnectionRestored();

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const tasks = await userService.getTasks(selectedTab === TasksTabsValues.STAGED);
        setTasks(tasks);
      } catch (error) {
        setError("error");
      } finally {
        setIsLoading(false);
      }
    })();

  }, [selectedTab]);

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange(async (wallet) => {
      if (wallet) {
        localStorageWrapper.set("address", wallet?.account.address);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tonConnectUI]);

  return {
    isLoading: isLoading || !connectionRestored,
    tasks,
    error,
  };
}

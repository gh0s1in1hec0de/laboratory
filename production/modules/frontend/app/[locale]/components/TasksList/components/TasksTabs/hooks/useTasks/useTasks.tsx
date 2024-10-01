import { useToggle } from "@/hooks";
import { userService } from "@/services";
import { Task } from "@/types";
import { useEffect, useState } from "react";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [staged, setStaged] = useToggle(false);

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const tasks = await userService.getTasks(staged);
        setTasks(tasks);
      } catch (error) {
        setError("error");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [staged]);

  return {
    isLoading,
    tasks,
    error,
    staged,
    setStaged,
  };
}

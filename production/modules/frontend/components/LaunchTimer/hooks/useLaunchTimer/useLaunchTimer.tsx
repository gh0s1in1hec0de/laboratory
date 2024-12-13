import { formatTime } from "@/utils";
import { useEffect, useLayoutEffect, useState } from "react";

export function useLaunchTimer(initialSeconds: number, isLoading?: boolean) {
  const [currentSeconds, setCurrentSeconds] = useState(initialSeconds);
  const [isMounted, setIsMounted] = useState(false);

  useLayoutEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const interval = setInterval(() => {
        setCurrentSeconds((prevSeconds) => {
          if (prevSeconds > 0) {
            return prevSeconds - 1;
          } else {
            clearInterval(interval);
            return 0;
          }
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isMounted]);

  return {
    ...formatTime(currentSeconds),
    isMounted,
  };
}

import { useEffect, useLayoutEffect, useState } from "react";

export function useLaunchTimer(initialSeconds: number | null, isLoading?: boolean) {
  const [currentSeconds, setCurrentSeconds] = useState(initialSeconds || 0);
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

  function formatTime(totalSeconds: number) {
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return {
      days: String(days).padStart(2, "0"),
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(secs).padStart(2, "0"),
    };
  }

  return {
    ...formatTime(currentSeconds),
    isMounted,
  };
}

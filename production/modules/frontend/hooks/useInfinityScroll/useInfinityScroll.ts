import { useEffect, useState } from "react";
import { UseInfinityScrollProps } from "./types";

export function useInfinityScroll({ callback, triggerRef }: UseInfinityScrollProps) {
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const triggerElement = triggerRef.current;
    let observer: IntersectionObserver | null = null;

    if (callback && triggerElement) {
      const options = {
        root: null,
        rootMargin: "0px",
        threshold: 1,
      };

      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && !isInitialLoad) {
          callback();
        } else if (entry.isIntersecting && isInitialLoad) {
          setIsInitialLoad(false);
        }
      }, options);

      observer.observe(triggerElement);
    }

    return () => {
      if (observer && triggerElement) {
        observer.unobserve(triggerElement);
      }
    };
  }, [callback, triggerRef, isInitialLoad]);
}

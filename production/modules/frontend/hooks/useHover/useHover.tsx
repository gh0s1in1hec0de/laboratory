import { useEffect, useRef, useState } from "react";
import { UseHoverProps } from "./types";

export function useHover(ref: UseHoverProps) {
  const [isHovering, setIsHovering] = useState(false);
  const mouseDown = useRef(false);

  const onMouseOverOrMove = () => setIsHovering(true);

  const onMouseDown = () => {
    mouseDown.current = true;
  };

  const onMouseUp = (event: MouseEvent) => {
    mouseDown.current = false;

    if (ref.current && !ref.current.contains(event.target as Node)) {
      setIsHovering(false);
    }
  };

  const onMouseOut = () => {
    if (!mouseDown.current) {
      setIsHovering(false);
    }
  };

  useEffect(() => {
    const node = ref.current;

    if (node) {
      node.addEventListener("mouseover", onMouseOverOrMove);
      node.addEventListener("mousemove", onMouseOverOrMove);
      node.addEventListener("mouseout", onMouseOut);
      node.addEventListener("mousedown", onMouseDown);
      document.addEventListener("mouseup", onMouseUp);

      return () => {
        node.removeEventListener("mouseover", onMouseOverOrMove);
        node.removeEventListener("mousemove", onMouseOverOrMove);
        node.removeEventListener("mouseout", onMouseOut);
        node.removeEventListener("mousedown", onMouseDown);
        document.removeEventListener("mouseup", onMouseUp);
      };
    }
  }, []);

  return isHovering;
}

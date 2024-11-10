import { useState } from "react";

export function useCustomButton() {
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseEnter() {
    setIsHovered(true);
  }

  function handleMouseLeave() {
    setIsHovered(false);
  }

  return { isHovered, handleMouseEnter, handleMouseLeave };
}

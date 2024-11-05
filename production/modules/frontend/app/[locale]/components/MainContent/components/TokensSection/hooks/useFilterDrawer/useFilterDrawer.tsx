import { useToggle } from "@/hooks/useToggle";
import { UseFilterDrawerProps } from "./types";

export function useFilterDrawer({
  prevFilterData,
  setFilterData,
}: UseFilterDrawerProps) {
  const [isOpenDrawer, toggleOpenDrawer] = useToggle(false);

  function onCloseDrawer() {
    setFilterData(prevFilterData);
    toggleOpenDrawer();
  }

  return {
    isOpenDrawer,
    toggleOpenDrawer,
    onCloseDrawer,
  };
}

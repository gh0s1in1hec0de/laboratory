import { CustomCheckbox } from "@/common/CustomCheckbox";
import { CustomDrawer } from "@/common/CustomDrawer";
import { useState } from "react";
import { FilterDrawerProps } from "./types";

export function FilterDrawer({ isOpenDrawer, toggleOpenDrawer }: FilterDrawerProps) {
  const [enabled, setEnabled] = useState(true);

  return (
    <CustomDrawer
      isOpen={isOpenDrawer}
      onClose={toggleOpenDrawer}
      onOpen={toggleOpenDrawer}
    >
      <CustomCheckbox checked={enabled} onChange={setEnabled} />
    </CustomDrawer>
  );
}

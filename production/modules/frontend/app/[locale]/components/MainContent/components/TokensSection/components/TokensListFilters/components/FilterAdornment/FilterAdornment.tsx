import { Box } from "@mui/material";
import { FilterSettingsIcon } from "@/icons";
import { FilterAdornmentProps } from "./types";
import styles from "./FilterAdornment.module.scss";

export function FilterAdornment({ toggleOpenDrawer }: FilterAdornmentProps) {
  return (
    <Box 
      className={styles.filterAdornment}
      onClick={toggleOpenDrawer}
    >
      <FilterSettingsIcon />
    </Box>
  );
}

import { Box } from "@mui/material";
import { FilterSettingsIcon } from "@/icons";
import { FilterAdornmentProps } from "./types";

export function FilterAdornment({ toggleOpenDrawer }: FilterAdornmentProps) {
  return (
    <Box 
      sx={{ 
        cursor: "pointer",
        paddingLeft: "14px",
        paddingRight: "6px",
        display: "flex",
        alignItems: "center",
      }}
      onClick={toggleOpenDrawer}
    >
      <FilterSettingsIcon />
    </Box>
  );
}

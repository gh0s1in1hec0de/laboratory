import { Box } from "@mui/material";
import { FilterSettingsIcon } from "@/icons";
import { CustomDrawer } from "@/common/CustomDrawer";
import { FilterAdornmentProps } from "./types";

export function FilterAdornment({ toggleOpenDrawer }: FilterAdornmentProps) {
  return (
    <Box 
      sx={{ 
        cursor: "pointer", 
        paddingX: "14px", 
        display: "flex", 
        alignItems: "center" 
      }}
      onClick={toggleOpenDrawer}
    >
      <FilterSettingsIcon />
    </Box>
  );
}

import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { LaunchInfoBoxProps } from "./types";

export function LaunchInfoBox({
  label,  
  value,
}: LaunchInfoBoxProps) {
  return (
    <Grid 
      container
      size="grow" 
      flexDirection="column"
      gap={1}
      justifyContent="space-between"
      alignItems="center"
    >  
      <Label 
        label={label} 
        variantSize="regular14"
        variantColor="gray"
        textAlign="center"
        cropped
      />
            
      <Grid 
        container
        width="100%"
      >
        <Label 
          label={value} 
          variantSize="semiBold18" 
          textAlign="center"
          cropped
        />
      </Grid>
    </Grid>
  );
}

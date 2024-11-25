import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { DropdownButtonProps } from "./types";
import Grid from "@mui/material/Grid2";
import styles from "./DropdownButton.module.scss";
import { ArrowDownIcon } from "@/icons";

export function DropdownButton({
  smallAddress,
  fullWidth,
}: DropdownButtonProps) {
  
  return (
    <CustomButton 
      as="div"
      padding={fullWidth ? "10px" : "6px 30px 6px 10px"}
      fullWidth={fullWidth}
    >
      <Grid 
        container 
        alignItems="center"   
        justifyContent="center"
        gap={1}
      >
        <Label
          label={smallAddress}
          variantSize="medium16"
        />
        
        <ArrowDownIcon className={styles.icon} />
      </Grid>
    </CustomButton>
  );
}

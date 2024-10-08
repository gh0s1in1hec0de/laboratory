import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { DropdownButtonProps } from "./types";
import Grid from "@mui/material/Grid2";
import styles from "./DropdownButton.module.scss";
import { ArrowDownIcon } from "@/icons/quests";

export function DropdownButton({
  smallAddress,
}: DropdownButtonProps) {
  
  return (
    <CustomButton 
      as="div"
      onClick={() => {}}
      padding="10px 0"
      fullWidth
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

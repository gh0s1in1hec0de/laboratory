import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { DropdownButtonProps } from "./types";

export function DropdownButton({
  smallAddress,
}: DropdownButtonProps) {
  
  return (
    <CustomButton 
      as="div"
      background="orange"
      onClick={() => {}}
      padding="10px 0"
      fullWidth
    >
      <Label
        label={smallAddress}
        variantSize="medium16"
      />
    </CustomButton>
  );
}

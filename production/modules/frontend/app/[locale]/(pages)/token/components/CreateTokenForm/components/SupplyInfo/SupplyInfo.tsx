import { FormikCustomInput } from "@/components/FormikCustomInput";
import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";

export function SupplyInfo() {
  return (
    <Grid
      container
      gap={1}
      width="100%"
    >
      <Label 
        label="Supply" 
        variantSize="semiBold18" 
        offUserSelect
      />

      <FormikCustomInput
        name="totalSupply"
        placeholder="Specify quantity"
        fullWidth
      />

      <Label 
        label="* Total sales must exceed > 1 000 000"
        variantSize="regular14"
        variantColor="gray"
        offUserSelect
        cropped
      />
    </Grid>
  );
}

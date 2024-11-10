import { FormikCustomInput } from "@/components/FormikCustomInput";
import { FormikCustomTextarea } from "@/components/FormikCustomTextarea";
import Grid from "@mui/material/Grid2";

export function MetadataInfo() {
  return (
    <Grid
      container
      width="100%"
      gap={1}
    >
      <Grid container size="grow">
        <FormikCustomInput
          placeholder="$TICKER"
          name="symbol"
        />
      </Grid>
      
      <Grid container size="grow">
        <FormikCustomInput
          placeholder="Name"
          name="name"
        />
      </Grid>

      <FormikCustomTextarea
        name="description"
        placeholder="Token description"
        fullWidth
      />
    </Grid>
  );
}

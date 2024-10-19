import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { StarIcon } from "@/icons";
import { TokenInfoProps } from "./types";

export function TokenInfo({
  name,
  holders,
}: TokenInfoProps) {
  return (
    <Grid
      container
      justifyContent="center"
      direction="column"
      size="grow"
    >
      <Label
        label={name}
        variantSize="bold18"
      />

      <Grid
        container
        alignItems="center"
        gap={1}
      >
        <Label
          label="Name"
          variantSize="regular16"
        />

        <StarIcon />

        <Label
          label={`${holders} holders`}
          variantSize="regular14"
          variantColor="gray"
        />
      </Grid>
    </Grid>
  );
}

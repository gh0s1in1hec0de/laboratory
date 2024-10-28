import { MainBox } from "@/common/MainBox";
import { Label } from "@/common/Label";
import { StarIcon } from "@/icons";
import Grid from "@mui/material/Grid2";
import { AdditionalInfoProps } from "./types";

export function AdditionalInfo({ holders }: AdditionalInfoProps) {
  return (
    <Grid
      container
      gap={0.5}
      size={{ xs: 12 }}
      alignItems="center"
    >
      {/* <MainBox
        container
        alignItems="center"
        gap="2px"
        bgColor="orange"
        padding="4px 10px"
        rounded
      >
        <Label
          label="Public"
          variantSize="regular14"
          variantColor="orange"
        />
      </MainBox> */}

      <MainBox
        container
        alignItems="center"
        gap="2px"
        bgColor="gray"
        padding="4px 10px"
        rounded
      >
        <Label
          label="Star Club"
          variantSize="regular14"
        />
      </MainBox>

      <StarIcon />

      <Label
        label={`${holders} holders`}
        variantSize="regular14"
        variantColor="gray"
      />
    </Grid>
  );
}

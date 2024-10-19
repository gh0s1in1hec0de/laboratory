import Grid from "@mui/material/Grid2";
import { ProgressInfoProps } from "./types";
import { Label } from "@/common/Label";
import LinearProgress from "@mui/material/LinearProgress";
import styles from "./ProgressInfo.module.scss";

export function ProgressInfo({
  collected,
  max,
}: ProgressInfoProps) {
  return (
    <Grid
      container
      size={{ xs: 12 }}
      paddingTop={1}
      justifyContent="center"
      direction="column"
    >
      <Grid
        container
        size={{ xs: 12 }}
        justifyContent="flex-end"
        gap={0.5}
      >
        <LinearProgress
          variant="determinate"
          value={collected / max * 100}
          classes={{
            bar: styles.bar,
            root: styles.root,
          }}
        />

        <Label
          label={`${collected} / ${max} TON collected`}
          variantSize="regular14"
          variantColor="gray"
        />
      </Grid>
    </Grid>
  );
} 

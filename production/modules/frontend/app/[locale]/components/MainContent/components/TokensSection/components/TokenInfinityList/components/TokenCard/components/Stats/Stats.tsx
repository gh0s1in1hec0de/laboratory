import Grid from "@mui/material/Grid2";
import { CircularProgress } from "@mui/material";
import { Label } from "@/common/Label";
import { StatsProps } from "./types";
import styles from "./Stats.module.scss";
import { formatNumber } from "@/utils";

export function Stats({
  collected,
  max,
}: StatsProps) {
  return (
    <Grid
      position="relative"
      container
      flexDirection="column"
      alignItems="center"
      minWidth="65px"
      gap={0.5}
    >
      <CircularProgress
        variant="determinate"
        classes={{
          root: styles.bg,
        }}
        size={28}
        thickness={6}
        value={100}
      />
      
      <CircularProgress
        variant="determinate"
        classes={{
          root: styles.main,
          circle: styles.circle,
        }}
        value={collected > max ? 100 : collected / max * 100}
        size={28}
        thickness={6}
      />

      <Label
        label={`${formatNumber(collected)} / ${formatNumber(max)}`}
        variantSize="regular12"
        variantColor="gray"
        offUserSelect
      />
    </Grid>
  );
}

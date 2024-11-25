import { Skeleton } from "@mui/material";
import Grid from "@mui/material/Grid2";

export function RewardBalancesListSkeleton() {
  return (
    <Grid
      container
      flexDirection="column"
      alignItems="center"
      width="100%"
    >
      <Skeleton
        sx={{ bgcolor: "var(--skeleton-color)" }}
        variant="rounded"
        width="100%"
        height="500px"
      />
    </Grid>
  );
}

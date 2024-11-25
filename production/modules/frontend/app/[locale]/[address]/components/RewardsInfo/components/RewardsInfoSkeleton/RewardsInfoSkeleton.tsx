import { Skeleton } from "@mui/material";
import Grid from "@mui/material/Grid2";

export function RewardsInfoSkeleton() {
  return (
    <Grid
      container
      flexDirection="column"
      width="100%"
    >
      <Skeleton
        sx={{ bgcolor: "var(--skeleton-color)", fontSize: "36px" }}
        variant="text"
        width="100%"
      />

      <Skeleton
        sx={{ bgcolor: "var(--skeleton-color)" }}
        variant="rounded"
        width="100%"
        height="200px"
      />
    </Grid>
  );
}

import { Skeleton } from "@mui/material";
import Grid from "@mui/material/Grid2";

export function RewardsSkeleton() {
  return (
    <Grid
      container
      flexDirection="column"
      alignItems="center"
      width="100%"
      paddingTop={2}
    >
      <Skeleton
        sx={{ bgcolor: "var(--skeleton-color)", fontSize: "36px" }}
        variant="text"
        width="100%"
      />

      <Skeleton
        sx={{ bgcolor: "var(--skeleton-color)", fontSize: "36px" }}
        variant="text"
        width="100%"
      />

      <Grid container gap={1} width="100%">
        <Skeleton
          sx={{ bgcolor: "var(--skeleton-color)" }}
          variant="rounded"
          width="100%"
          height="150px"
        />
        <Skeleton
          sx={{ bgcolor: "var(--skeleton-color)" }}
          variant="rounded"
          width="100%"
          height="150px"
        />
        <Skeleton
          sx={{ bgcolor: "var(--skeleton-color)" }}
          variant="rounded"
          width="100%"
          height="150px"
        />
      </Grid>
    </Grid>
  );
}

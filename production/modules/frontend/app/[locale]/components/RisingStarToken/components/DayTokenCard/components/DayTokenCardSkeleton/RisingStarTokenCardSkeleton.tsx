import Grid from "@mui/material/Grid2";
import { Skeleton } from "@mui/material";

export function RisingStarTokenCardSkeleton() {
  return (
    <Grid
      container
      gap={1}
      size={{ xs: 12 }}
    >
      <Grid container>
        <Skeleton
          sx={{ bgcolor: "var(--skeleton-color)" }}
          variant="circular"
          width="78px"
          height="78px"
        />
      </Grid>

      <Grid
        container
        direction="column"
        justifyContent="center"
        size="grow"
      >
        <Skeleton
          sx={{ bgcolor: "var(--skeleton-color)", fontSize: "24px" }}
          variant="text"
          width="100%"
        />

        <Grid
          container
          alignItems="center"
          justifyContent="space-between"
          size={{ xs: 12 }}
        >
          <Skeleton
            sx={{ bgcolor: "var(--skeleton-color)", fontSize: "20px" }}
            variant="text"
            width="49%"
          />

          <Skeleton
            sx={{ bgcolor: "var(--skeleton-color)", fontSize: "20px" }}
            variant="text"
            width="49%"
          />
        </Grid>
      </Grid>
    </Grid>
  );
}

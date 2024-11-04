import { Skeleton } from "@mui/material";
import Grid from "@mui/material/Grid2";

export function getSkeletons() {
  return new Array(10)
    .fill(0)
    .map((_, index) => (
      <Grid
        key={index}
        container
        paddingY={1}
        alignItems="center"
        size="grow"
        gap={1}
      >
        <Grid size={2}>
          <Skeleton
            sx={{ bgcolor: "var(--skeleton-color)" }}
            variant="circular"
            width="56px"
            height="56px"
          />
        </Grid>

        <Grid size="grow">
          <Skeleton
            sx={{ bgcolor: "var(--skeleton-color)", fontSize: "20px" }}
            variant="text"
            width="100%"
          />
          <Skeleton
            sx={{ bgcolor: "var(--skeleton-color)", fontSize: "20px" }}
            variant="text"
            width="100%"
          />
        </Grid>
      </Grid>
    ));
}


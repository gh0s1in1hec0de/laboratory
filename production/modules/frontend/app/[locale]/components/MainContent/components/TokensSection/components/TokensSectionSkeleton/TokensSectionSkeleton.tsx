import { Skeleton } from "@mui/material";
import Grid from "@mui/material/Grid2";

export function TokensSectionSkeleton() {
  return (
    <Grid 
      container 
      width="100%"
    >
      <Skeleton
        sx={{ bgcolor: "var(--skeleton-color)", fontSize: "44px" }}
        variant="text"
        width="100%"
      />

      <Grid 
        container 
        width="100%"
      >
        <Skeleton 
          sx={{ bgcolor: "var(--skeleton-color)", fontSize: "44px" }}
          variant="rectangular"
          width="100%"
          height="300px"
        />
      </Grid>
    </Grid>
  );
}

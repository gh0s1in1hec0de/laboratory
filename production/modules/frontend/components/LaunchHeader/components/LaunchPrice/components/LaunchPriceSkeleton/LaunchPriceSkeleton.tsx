import { Skeleton } from "@mui/material";
import Grid from "@mui/material/Grid2";

export function LaunchPriceSkeleton (){
  return (
    <Grid 
      container
      width="100%"
    >
      <Skeleton
        sx={{ bgcolor: "var(--skeleton-color)" }}
        variant="rounded"
        width="100%"
        height="50px"
      />
    </Grid>
  );
}

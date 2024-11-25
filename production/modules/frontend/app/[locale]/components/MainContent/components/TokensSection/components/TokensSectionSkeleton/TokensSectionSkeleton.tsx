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

      <Grid container width="100%" gap={1}>
        {new Array(10)
          .fill(0)
          .map((_, index) => (
            <Grid 
              key={index}
              container 
              width="100%"
              gap={1}
            >
              <Grid container>
                <Skeleton
                  sx={{ bgcolor: "var(--skeleton-color)" }}
                  variant="circular"
                  width="48px"
                  height="48px"
                />
              </Grid>

              <Grid container size="grow">
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
          ))}
      </Grid>
    </Grid>
  );
}

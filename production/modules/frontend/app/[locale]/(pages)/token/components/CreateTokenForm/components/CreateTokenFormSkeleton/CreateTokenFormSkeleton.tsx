import { BgLight } from "@/common/BgLight";
import { Skeleton } from "@mui/material";
import Grid from "@mui/material/Grid2";

export function CreateTokenFormSkeleton() {
  return (
    <Grid 
      container
      flexDirection="column"
      alignItems="center"
      width="100%"
      paddingTop={2}
      gap={1}
    >
      <BgLight/>

      <Skeleton
        sx={{ bgcolor: "var(--skeleton-color)" }}
        variant="circular"
        width="78px"
        height="78px"
      />

      <Grid
        container
        width="100%"
        gap={1}
      >
        <Grid container size="grow">
          <Skeleton
            sx={{ bgcolor: "var(--skeleton-color)" }}
            variant="rounded"
            width="100%"
            height="40px"
          />
        </Grid>

        <Grid container size="grow">
          <Skeleton
            sx={{ bgcolor: "var(--skeleton-color)" }}
            variant="rounded"
            width="100%"
            height="40px"
          />
        </Grid>

        <Skeleton
          sx={{ bgcolor: "var(--skeleton-color)" }}
          variant="rounded"
          width="100%"
          height="100px"
        />
      </Grid>

      <Skeleton
        sx={{ bgcolor: "var(--skeleton-color)" }}
        variant="rounded"
        width="100%"
        height="400px"
      />
    </Grid>
  );
}

import Grid from "@mui/material/Grid2";
import { Box, Skeleton } from "@mui/material";
import { BgLight } from "@/common/BgLight";

export function CurrentLaunchSkeleton() {
  return (
    <Grid
      container
      flexDirection="column"
      alignItems="center"
      width="100%"
      paddingTop={2}
    >
      <BgLight />

      <Skeleton
        sx={{ bgcolor: "var(--skeleton-color)" }}
        variant="circular"
        width="78px"
        height="78px"
      />

      <Skeleton
        sx={{ bgcolor: "var(--skeleton-color)", fontSize: "30px" }}
        variant="text"
        width="50%"
      />

      <Skeleton
        sx={{ bgcolor: "var(--skeleton-color)", fontSize: "24px" }}
        variant="text"
        width="70%"
      />

      <Box paddingTop={2} width="100%">
        <Skeleton
          sx={{ bgcolor: "var(--skeleton-color)" }}
          variant="rounded"
          width="100%"
          height="400px"
        />
      </Box>
    </Grid>
  );
}

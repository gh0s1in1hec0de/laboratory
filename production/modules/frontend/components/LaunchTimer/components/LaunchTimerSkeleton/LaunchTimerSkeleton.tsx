import { Skeleton } from "@mui/material";

export function LaunchTimerSkeleton() {
  return (
    <Skeleton
      sx={{ bgcolor: "var(--skeleton-color)" }}
      variant="rounded"
      width="100%"
      height="100px"
    />
  );
}

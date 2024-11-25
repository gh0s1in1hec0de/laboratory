import { Skeleton } from "@mui/material";

export function RewardBlockSkeleton() {
  return (
    <Skeleton
      sx={{ bgcolor: "var(--skeleton-color)" }}
      variant="rounded"
      width="100%"
      height="34px"
    />
  );
}

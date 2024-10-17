import { Skeleton } from "@mui/material";
import { ConnectButtonSkeletonProps } from "./types";

export function ConnectButtonSkeleton({ fullWidth = false }: ConnectButtonSkeletonProps) {
  return (
    <Skeleton
      sx={{ bgcolor: "var(--skeleton-color)" }}
      variant="rounded"
      width={fullWidth ? "100%" : "35%"}
      height={fullWidth ? "40px" : "32px"}
    />
  );
}

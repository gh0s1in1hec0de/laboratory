import { Skeleton } from "@mui/material";

export function ConnectButtonSkeleton() {
  return (
    <Skeleton
      sx={{ bgcolor: "var(--skeleton-color)" }}
      variant="rounded"
      width="100%"
      height="40px"
    />
  );
}

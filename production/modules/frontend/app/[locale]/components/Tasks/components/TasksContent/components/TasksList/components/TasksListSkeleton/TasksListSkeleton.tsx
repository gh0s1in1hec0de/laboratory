import { Skeleton } from "@mui/material";

export function TasksListSkeleton() {
  return (
    <Skeleton
      sx={{ bgcolor: "var(--skeleton-color)" }}
      variant="rounded"
      width="100%"
      height="300px"
    />
  );
}

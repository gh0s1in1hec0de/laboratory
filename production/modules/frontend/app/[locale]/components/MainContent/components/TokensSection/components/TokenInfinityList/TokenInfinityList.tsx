import { Label } from "@/common/Label";
import { useInfinityScroll } from "@/hooks";
import { Box } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { MutableRefObject, useRef } from "react";
import { TokenCard } from "./components/TokenCard";
import { getSkeletons } from "./components/TokenCardSkeleton";
import { TokenInfinityListProps } from "./types";

// todo: add virtual list
export function TokenInfinityList({
  fetchNextPage,
  launchesData,
  isLoadingNextPage
}: TokenInfinityListProps) {
  const t = useTranslations("Top");
  const triggerRef = useRef() as MutableRefObject<HTMLDivElement>;

  useInfinityScroll({
    triggerRef,
    callback: fetchNextPage,
  });

  if (!isLoadingNextPage && !launchesData.launchesChunk.length) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        <Label
          variantColor="gray"
          variantSize="regular16"
          label={t("launchesNotFound")}
        />
      </Box>
    );
  }

  return (
    <Grid
      container
      size="grow"
      flexDirection="column"
    >
      <Grid
        container
        size="grow"
        flexDirection="column"
        gap={0.5}
      >
        {launchesData.launchesChunk.map((launch) => (
          <TokenCard
            key={launch.id}
            launch={launch}
          />
        ))}
      </Grid>

      {isLoadingNextPage && getSkeletons()}

      <Box ref={triggerRef} style={{ width: "100%", height: "20px" }} />
    </Grid>
  );
}

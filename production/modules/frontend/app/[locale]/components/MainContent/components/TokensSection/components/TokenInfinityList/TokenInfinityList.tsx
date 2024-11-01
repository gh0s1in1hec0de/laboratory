import { Label } from "@/common/Label";
import { useInfinityScroll } from "@/hooks";
import { MutableRefObject, useRef } from "react";
import { TokenInfinityListProps } from "./types";
import { Box } from "@mui/material";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import Grid from "@mui/material/Grid2";
import { TokenCard } from "./components/TokenCard";
import { useTranslations } from "next-intl";
import { getSkeletons } from "./components/TokenCardSkeleton";

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
    <>
      <Grid 
        container 
        size="grow" 
        flexDirection="column"
        gap={0.5}
      >
        {launchesData.launchesChunk.map((launch) => ( 
          <TokenCard 
            key={launch.id} 
          />
        ))}
      </Grid>
      {/* <Box style={{ width: "100%", height: "100vh", display: "flex", justifyContent: "flex-end", flexDirection: "column" }}> */}
      {/* {launchesData.launchesChunk.map((launch) => (
        <Label key={launch.address} label={launch.address + " " + launch.totalSupply} />
      ))} */}
      {isLoadingNextPage && getSkeletons()}
      <Box ref={triggerRef} style={{ width: "100%", height: "20px", backgroundColor: "red" }} />
    </>
  );
}

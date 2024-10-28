import { Label } from "@/common/Label";
import { useInfinityScroll } from "@/hooks";
import { MutableRefObject, useRef } from "react";
import { TokenInfinityListProps } from "./types";
import { Box } from "@mui/material";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import Grid from "@mui/material/Grid2";
import { TokenCard } from "./components/TokenCard";

export function TokenInfinityList({
  fetchNextPage,
  launchesData,
  isLoadingNextPage
}: TokenInfinityListProps) {
  const triggerRef = useRef() as MutableRefObject<HTMLDivElement>;

  // useInfinityScroll({
  //   triggerRef,
  //   callback: fetchNext,
  // });

  // if (!isLoading && !launchesData.launchesChunk.length) {
  if (!launchesData.launchesChunk.length) {
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
          label="Совпадений не найдено"
        />
      </Box>
    );
  }

  return (
    <LoadingWrapper
      isLoading={isLoadingNextPage}
      skeleton={<Label label="Loading..." />}
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
          />
        ))}
      </Grid>
      {/* <Box style={{ width: "100%", height: "100vh", display: "flex", justifyContent: "flex-end", flexDirection: "column" }}> */}
      {/* {launchesData.launchesChunk.map((launch) => (
        <Label key={launch.address} label={launch.address + " " + launch.totalSupply} />
      ))} */}

      {/* <Box ref={triggerRef} style={{ width: "100%", height: "20px", backgroundColor: "red" }} /> */}
    </LoadingWrapper>
  );
}

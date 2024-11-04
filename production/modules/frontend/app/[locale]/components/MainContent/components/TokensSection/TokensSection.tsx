"use client";

import { Label } from "@/common/Label";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import Grid from "@mui/material/Grid2";
import { FilterDrawer } from "./components/FilterDrawer";
import { TokenInfinityList } from "./components/TokenInfinityList";
import { TokensListFilters } from "./components/TokensListFilters";
import { TokensSectionSkeleton } from "./components/TokensSectionSkeleton";
import { useTokensList } from "./hooks/useTokensList";

export function TokensSection() {
  const {
    search,
    handleSearch,
    launchesData,
    fetchTokenLaunchesNextPage,
    isLoadingPage,
    isLoadingNextPage,
    errorText,
    isOpenDrawer,
    toggleOpenDrawer,
  } = useTokensList();

  if (errorText) {
    return (
      <Grid container justifyContent="center" width="100%">
        <Label label={errorText} variantColor="red" variantSize="regular14" />
      </Grid>
    );
  }

  return (
    <LoadingWrapper
      isLoading={isLoadingPage}
      skeleton={<TokensSectionSkeleton />}
    >
      <Grid
        container
        width="100%"
      >
        <TokensListFilters
          search={search}
          handleSearch={handleSearch}
          toggleOpenDrawer={toggleOpenDrawer}
        />
      </Grid>

      <FilterDrawer
        isOpenDrawer={isOpenDrawer}
        toggleOpenDrawer={toggleOpenDrawer}
      />

      <TokenInfinityList
        fetchNextPage={fetchTokenLaunchesNextPage}
        launchesData={launchesData}
        isLoadingNextPage={isLoadingNextPage}
      />
    </LoadingWrapper>
  );
}

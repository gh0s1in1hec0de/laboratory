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
    filterData,
    search,
    handleSearchChange,
    handleSucceedChange,
    handleCreatedByChange,
    handleOrderByChange,
    hasFilterDataChanged,
    launchesData,
    handleOrderChange,
    fetchTokenLaunchesNextPage,
    isLoadingPage,
    isLoadingNextPage,
    errorText,
    isOpenDrawer,
    toggleOpenDrawer,
    handleResetFilter,
    handleApplyFilter,
    onCloseDrawer,
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
          handleSearch={handleSearchChange}
          toggleOpenDrawer={toggleOpenDrawer}
        />
      </Grid>

      <FilterDrawer
        isOpenDrawer={isOpenDrawer}
        toggleOpenDrawer={toggleOpenDrawer}
        succeed={filterData.succeed}
        handleSucceedChange={handleSucceedChange}
        createdBy={filterData.createdBy}
        handleCreatedByChange={handleCreatedByChange}
        orderBy={filterData.orderBy}
        handleOrderByChange={handleOrderByChange}
        order={filterData.order}
        handleOrderChange={handleOrderChange}
        handleResetFilter={handleResetFilter}
        handleApplyFilter={handleApplyFilter}
        hasFilterDataChanged={hasFilterDataChanged}
        onCloseDrawer={onCloseDrawer}
      />

      <TokenInfinityList
        fetchNextPage={fetchTokenLaunchesNextPage}
        launchesData={launchesData}
        isLoadingNextPage={isLoadingNextPage}
      />
    </LoadingWrapper>
  );
}

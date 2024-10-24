"use client";

import Grid from "@mui/material/Grid2";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { TokensSectionSkeleton } from "./components/TokensSectionSkeleton";
import { TokenInfinityList } from "./components/TokenInfinityList";
import { TokensListFilters } from "./components/TokensListFilters";
import { useTokensList } from "./hooks/useTokensList";

export function TokensSection() {
  const { 
    search, 
    handleSearch 
  } = useTokensList();

  return (
    <LoadingWrapper
      isLoading={false}
      skeleton={<TokensSectionSkeleton />}
    >
      <Grid 
        container 
        width="100%"
      >
        <TokensListFilters
          search={search}
          handleSearch={handleSearch}
        />
      </Grid>

      <TokenInfinityList />
    </LoadingWrapper>
  );
}

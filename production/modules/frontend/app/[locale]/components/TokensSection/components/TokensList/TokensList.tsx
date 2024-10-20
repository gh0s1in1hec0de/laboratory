"use client";

import Grid from "@mui/material/Grid2";
import { CustomInput } from "@/common/CustomInput";
import { ChangeEvent, useState } from "react";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { TokensListSkeleton } from "./components/TokensListSkeleton";

export function TokensList() {
  const [search, setSearch] = useState<string>("");

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value);
  }

  return (
    <LoadingWrapper
      isLoading={false}
      skeleton={<TokensListSkeleton />}
    >
      <Grid 
        container 
        width="100%"
      >
        <CustomInput 
          placeholder="Search"
          name="email"
          value={search}
          onChange={handleSearch}
          startAdornment="loupe"
        />
      </Grid>
    </LoadingWrapper>
  );
}

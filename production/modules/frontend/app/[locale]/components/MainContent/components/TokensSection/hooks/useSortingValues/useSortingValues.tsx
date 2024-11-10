import { CALLER_ADDRESS } from "@/constants";
import { useDebounce } from "@/hooks";
import { localStorageWrapper } from "@/utils";
import { useState } from "react";
import { LaunchSortParameters, SortingOrder } from "starton-periphery";
import { UseSortingValuesProps } from "./types";

export function useSortingValues({
  setFilterData,
  fetchTokenLaunches,
}: UseSortingValuesProps) {
  const [search, setSearch] = useState<string>("");
  const debouncedFetchList = useDebounce(fetchTokenLaunches, [500]);

  function handleSearchChange(value: string) {
    setSearch(value);

    setFilterData((prevData) => {
      const updatedData = {
        ...prevData,
        page: 1,
        search: value,
      };
      debouncedFetchList(updatedData);
      return updatedData;
    });
  }

  function handleSucceedChange(value: boolean) {
    setFilterData((prevData) => ({
      ...prevData,
      succeed: prevData.succeed === value ? undefined : value,
    }));
  }

  function handleCreatedByChange(value: boolean) {
    setFilterData((prevData) => ({
      ...prevData,
      createdBy: !!prevData.createdBy === value ? "" : localStorageWrapper.get(CALLER_ADDRESS),
    }));
  }

  function handleOrderByChange(value: LaunchSortParameters) {
    setFilterData((prevData) => ({
      ...prevData,
      orderBy: value,
    }));
  }

  function handleOrderChange(value: SortingOrder) {
    setFilterData((prevData) => ({
      ...prevData,
      order: value,
    }));
  }

  return {
    search,
    handleSearchChange,
    handleSucceedChange,
    handleCreatedByChange,
    handleOrderByChange,
    handleOrderChange,
  };
}

import { useDebounce } from "@/hooks";
import { launchService } from "@/services";
import { ChangeEvent, useEffect, useState } from "react";
import { initialFilterData, initialLaunchesData } from "./initValue";
import type { GetLaunchesChunkRequest, GetLaunchesChunkResponse } from "starton-periphery";
import { filterRequestParams } from "./helpers";

export function useTokensList() {
  const [filterData, setFilterData] = useState<GetLaunchesChunkRequest>(initialFilterData);
  const [launchesData, setLaunchesData] = useState<GetLaunchesChunkResponse>(initialLaunchesData);
  const [search, setSearch] = useState<string>("");
  const [errorText, setErrorText] = useState<string>("");
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);
  const [isLoadingNextPage, setIsLoadingNextPage] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        await fetchTokenLaunches(filterData);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingPage(false);
      }
    })();
  }, []);

  async function fetchTokenLaunches(data: GetLaunchesChunkRequest) {
    try {
      const res = await launchService.getTokenLaunches(filterRequestParams(data));
      setLaunchesData(res);
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchTokenLaunchesNextPage() {
    if (!launchesData?.hasMore) return;

    setFilterData((prevData) => {
      const updatedData = {
        ...prevData,
        page: prevData.page + 1,
      };
      fetchTokenLaunches(updatedData);
      return updatedData;
    });
  }

  const debouncedFetch = useDebounce(fetchTokenLaunches, [500]);

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    const newSearch = event.target.value;
    setSearch(newSearch);

    setFilterData((prevData) => {
      const updatedData = {
        ...prevData,
        page: 1,
        search: newSearch,
      };
      debouncedFetch(updatedData);
      return updatedData;
    });
  }

  return {
    search,
    handleSearch,
    fetchTokenLaunches,
    launchesData,
    fetchTokenLaunchesNextPage,
    isLoadingPage,
    isLoadingNextPage,
  };
}

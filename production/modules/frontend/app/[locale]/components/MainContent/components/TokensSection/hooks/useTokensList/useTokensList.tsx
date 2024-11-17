import { launchService } from "@/services";
import { getErrorText } from "@/utils";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type {
  GetLaunchesChunkRequest,
  GetLaunchesChunkResponse
} from "starton-periphery";
import { useFilterDrawer } from "../useFilterDrawer";
import { useSortingValues } from "../useSortingValues";
import { filterRequestParams } from "./helpers";
import { initialFilterData, initialLaunchesData } from "./initValue";

export function useTokensList() {
  const t = useTranslations("Top");

  const [filterData, setFilterData] = useState<GetLaunchesChunkRequest>(initialFilterData);
  const [prevFilterData, setPrevFilterData] = useState<GetLaunchesChunkRequest>(initialFilterData);

  const [launchesData, setLaunchesData] = useState<GetLaunchesChunkResponse>(initialLaunchesData);

  const [errorText, setErrorText] = useState<string>("");
  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);
  const [isLoadingNextPage, setIsLoadingNextPage] = useState<boolean>(false);

  // drawer management
  const {
    isOpenDrawer,
    toggleOpenDrawer,
    onCloseDrawer
  } = useFilterDrawer({
    prevFilterData,
    setFilterData,
  });

  // change sorting values management
  const {
    handleSearchChange,
    handleSucceedChange,
    handleCreatedByChange,
    handleOrderByChange,
    handleOrderChange,
    search
  } = useSortingValues({
    setFilterData,
    fetchTokenLaunches
  });


  async function fetchTokenLaunches(data: GetLaunchesChunkRequest, isNextPage = false) {
    try {
      const res = await launchService.getTokenLaunches(filterRequestParams(data));

      setLaunchesData(prev => isNextPage ? {
        ...res,
        launchesChunk: [...prev.launchesChunk, ...res.launchesChunk],
        hasMore: res.hasMore,
      } : res);
    } catch (error) {
      setErrorText(getErrorText(error, t("commonError")));
    }
  }

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

  async function fetchTokenLaunchesNextPage() {
    if (!launchesData?.hasMore || isLoadingNextPage) return;

    setIsLoadingNextPage(true);

    const nextPageData = {
      ...filterData,
      page: filterData.page + 1,
    };

    await fetchTokenLaunches(nextPageData, true);
    setFilterData(nextPageData);
    setIsLoadingNextPage(false);
  }

  async function handleResetFilter() {
    toggleOpenDrawer();
    setFilterData(initialFilterData);
    setPrevFilterData(initialFilterData);
    await fetchTokenLaunches(initialFilterData);
  }

  async function handleApplyFilter() {
    toggleOpenDrawer();

    const newFilterData = {
      ...filterData,
      page: 1,
    };

    setPrevFilterData(newFilterData);
    await fetchTokenLaunches(newFilterData);
  }

  function hasFilterDataChanged(compareTo: GetLaunchesChunkRequest = prevFilterData) {
    const fieldsToCompare: (keyof GetLaunchesChunkRequest)[] = ["orderBy", "order", "createdBy", "succeed"];
    return fieldsToCompare.some((field) => filterData[field] !== compareTo[field]);
  }

  return {
    filterData,
    search,
    handleSearchChange,
    handleSucceedChange,
    handleCreatedByChange,
    handleOrderByChange,
    handleResetFilter,
    handleOrderChange,
    handleApplyFilter,
    hasFilterDataChanged,
    launchesData,
    fetchTokenLaunchesNextPage,
    isLoadingPage,
    isLoadingNextPage,
    errorText,
    isOpenDrawer,
    toggleOpenDrawer,
    onCloseDrawer,
  };
}

import { Dispatch, SetStateAction } from "react";
import { GetLaunchesChunkRequest } from "starton-periphery";

export interface UseSortingValuesProps {
  setFilterData: Dispatch<SetStateAction<GetLaunchesChunkRequest>>;
  fetchTokenLaunches: (data: GetLaunchesChunkRequest) => void;
}

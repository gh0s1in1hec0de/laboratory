import { Dispatch, SetStateAction } from "react";
import type { GetLaunchesChunkRequest } from "starton-periphery";
  
export interface UseFilterDrawerProps {
  prevFilterData: GetLaunchesChunkRequest;
  setFilterData: Dispatch<SetStateAction<GetLaunchesChunkRequest>>;
}

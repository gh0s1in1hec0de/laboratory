import { GetLaunchesChunkRequest } from "starton-periphery";

export function filterRequestParams(data: GetLaunchesChunkRequest): Partial<GetLaunchesChunkRequest> {
  return Object.fromEntries(
    Object.entries(data).filter(
      ([_, value]) => value !== undefined && value !== ""
    )
  );
}
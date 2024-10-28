import { oracleService } from "@/api";
import { LAUNCH_ERROR } from "@/errors";
import { LAUNCH_ROUTES } from "@/routes";
import type { GetLaunchesChunkRequest, GetLaunchesChunkResponse } from "starton-periphery";

async function getTokenLaunches(req: Partial<GetLaunchesChunkRequest>): Promise<GetLaunchesChunkResponse> {
  try {
    const filteredParams = Object.fromEntries(
      Object.entries(req).filter(
        ([_, value]) => value !== undefined && value !== ""
      )
    );

    const { data } = await oracleService.get<GetLaunchesChunkResponse>(LAUNCH_ROUTES.GetTokenLaunches, {
      params: filteredParams,
    });

    return data;
  } catch (error) {
    console.error(LAUNCH_ERROR.GetTokenLaunches, error);
    throw error;
  }
}

export const launchService = {
  getTokenLaunches
};

import { managerService, oracleService } from "@/api";
import { CreateTokenFormFields } from "@/app/[locale]/(pages)/token/components/CreateTokenForm/hooks/useCreateToken";
import { LAUNCH_ERROR } from "@/errors";
import { LAUNCH_ROUTES } from "@/routes";
import type { GetLaunchesChunkRequest, GetLaunchesChunkResponse, GetRisingStarResponse, UploadMetadataToIpfsRequest } from "starton-periphery";

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

async function getRisingStar(): Promise<GetRisingStarResponse> {
  try {
    const { data } = await oracleService.get<GetRisingStarResponse>(LAUNCH_ROUTES.GetRisingStar);

    return data;
  } catch (error) {
    console.error(LAUNCH_ERROR.GetTokenLaunches, error);
    throw error;
  }
}

async function saveMetadata({
  image,
  links,
  metadata,
  influencerSupport
}: UploadMetadataToIpfsRequest): Promise<string> {
  try {
    const { data } = await managerService.post<string>(
      LAUNCH_ROUTES.SaveMetadata,
      {
        links,
        image,
        metadata,
        influencerSupport: influencerSupport?.toString(),
      }
    );

    return data;
  } catch (error) {
    console.error(LAUNCH_ERROR.GetTokenLaunches, error);
    throw error;
  }
}

export const launchService = {
  getTokenLaunches,
  getRisingStar,
  saveMetadata
};

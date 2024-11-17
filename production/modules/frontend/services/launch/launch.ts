import type { 
  GetCertainLaunchRequest,
  GetCertainLaunchResponse,
  GetLaunchesChunkRequest,
  GetLaunchesChunkResponse,
  GetRisingStarResponse,
  UploadMetadataToIpfsRequest
} from "starton-periphery";
import { managerService, oracleService } from "@/api";
import { LAUNCH_ERROR } from "@/errors";
import { LAUNCH_ROUTES } from "@/routes";

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

async function getCurrentToken({
  creator,
  address,
  metadataUri
}: GetCertainLaunchRequest): Promise<GetCertainLaunchResponse> {
  try {
    const { data } = await oracleService.get<GetCertainLaunchResponse>(LAUNCH_ROUTES.GetCertainToken, {
      params: {
        creator,
        address,
        metadataUri
      }
    });
    return data;

    // todo delete this
    // return {
    //   "id": 1,
    //   "address": "0:5cd41b7c168725401bf7903d2ae23fb56b2c267af791bcf155b592f198cc0f7e",
    //   "identifier": "EXM Example Token This is an example token description",
    //   "creator": "0:a7e946a41455c1625b05ec8b4031e9863b5a6c01b569364ff8cb416ec9790457",
    //   "version": "V1",
    //   "metadata": {
    //     "uri": "https://ipfs.io/ipfs/QmVCMdxyudybb9vDefct1qU3DEZBhj3zhg3n9uM6EqGbN6",
    //     "name": "Example Token",
    //     "image": "https://ipfs.io/ipfs/Qmb4Yjspwz3gVq371wvVN9hqzzAoopzv5W1yS49qdTJJ7f",
    //     "symbol": "EXM",
    //     "decimals": "6",
    //     "description": "This is an example token description"
    //   },
    //   "timings": {
    //     "endTime": 1731684700,
    //     "startTime": 1731628319,
    //     "wlRoundEndTime": 1731651458,
    //     "publicRoundEndTime": 1731674031,
    //     "creatorRoundEndTime": 1731644202
    //   },
    //   "totalSupply": 666666000000n,
    //   "platformShare": 0.5,
    //   "minTonTreshold": 1000000000000n,
    //   "createdAt": 1731628019,
    //   "isSuccessful": null,
    //   "postDeployEnrollmentStats": null,
    //   "dexData": null,
    //   "tokenLaunch": "0:5cd41b7c168725401bf7903d2ae23fb56b2c267af791bcf155b592f198cc0f7e",
    //   "creatorTonsCollected": 1000000000n,
    //   "wlTonsCollected": 0n,
    //   "pubTonsCollected": 0n,
    //   "totalTonsCollected": 1000000000n,
    //   "onchainMetadataLink": "https://ipfs.io/ipfs/QmVCMdxyudybb9vDefct1qU3DEZBhj3zhg3n9uM6EqGbN6",
    //   "telegramLink": "https://t.me/juicy_bitches",
    //   "xLink": "https://x.com/juicy_bitches",
    //   "website": "https://juicy_bitches.cia",
    //   "influencerSupport": true,
    //   "activeHolders": 0
    // };
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
  saveMetadata,
  getCurrentToken,
};

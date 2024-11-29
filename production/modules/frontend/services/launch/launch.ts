import type { 
  GetCertainLaunchRequest,
  GetCertainLaunchResponse,
  GetLaunchesChunkRequest,
  GetLaunchesChunkResponse,
  GetRisingStarResponse,
  UploadMetadataToIpfsRequest,
  BuyWhitelistRequest
} from "starton-periphery";
import { managerService, oracleService } from "@/api";
import { LAUNCH_ERROR } from "@/errors";
import { LAUNCH_ROUTES } from "@/routes";
import { Address } from "@ton/core";

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
        ...(creator ? { creator: Address.parse(creator).toRawString() } : {}),
        ...(address ? { address: Address.parse(address).toRawString() } : {}),
        ...(metadataUri ? { metadataUri } : {}),
      }
    });
    return data;

    // todo delete this
    // return {
    //   "id": 10,
    //   "address": "0:4f9ce653babb9c1e90ea2b5fd5a83a12fa729a0e768dbfdc9c4bcde1160abb3f",
    //   "identifier": "CHAD ChadCoin Only for the absolute Chads of crypto.",
    //   "creator": "0:ef0d5d3ea8eae576bcb81b4550a5eb7f8e36579ca857b2178d97f675eec49731",
    //   "version": "V2",
    //   "tradingStats": {
    //     "trend": "bearish", // bullish && bearish
    //     "delta": BigInt(100)
    //   },
    //   "metadata": {
    //     "uri": "https://random_uri_link_10",
    //     "name": "ChadCoin",
    //     "image": "https://cdn-icons-png.flaticon.com/128/2268/2268386.png",
    //     "symbol": "CHAD",
    //     "decimals": "6",
    //     "description": "Only for the absolute Chads of crypto."
    //   },
    //   "timings": {
    //     "endTime": 1732804650,
    //     "startTime": 1732752531,
    //     "wlRoundEndTime": 1732774193,
    //     "publicRoundEndTime": 1732798731,
    //     "creatorRoundEndTime": 1732762389
    //   },
    //   "totalSupply": BigInt(666666000000),
    //   "platformShare": 1.5,
    //   "minTonTreshold": BigInt(1000000000000),
    //   "createdAt": 1732752231,
    //   "isSuccessful": null,
    //   "postDeployEnrollmentStats": null,
    //   "dexData": null,
    //   "tokenLaunch": "0:4f9ce653babb9c1e90ea2b5fd5a83a12fa729a0e768dbfdc9c4bcde1160abb3f",
    //   "creatorTonsCollected": BigInt(1000000000),
    //   "wlTonsCollected": BigInt(5000000000),
    //   "pubTonsCollected": BigInt(0),
    //   "totalTonsCollected": BigInt(6000000000),
    //   "onchainMetadataLink": "https://random_uri_link_10",
    //   "telegramLink": "https://t.me/juicy_bitches",
    //   "xLink": "https://x.com/juicy_bitches",
    //   "website": "https://juicy_bitches.cia",
    //   "influencerSupport": true,
    //   "activeHolders": 5
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

async function postBuyWl({
  callerAddress,
  launchAddress
}: BuyWhitelistRequest): Promise<void> {
  try {
    await managerService.post<void>(
      LAUNCH_ROUTES.BuyWl,
      {
        callerAddress: Address.parse(callerAddress).toRawString(),
        launchAddress: Address.parse(launchAddress).toRawString(),
      }
    );
  } catch (error) {
    console.error(LAUNCH_ERROR.BuyWl, error);
    throw error;
  }
}

export const launchService = {
  getTokenLaunches,
  getRisingStar,
  saveMetadata,
  getCurrentToken,
  postBuyWl,
};

import { LaunchSortParameters, SortingOrder, } from "./utils";
import { Coins, GlobalVersions, RawAddressString } from "./standards";
import { JettonMetadata } from "./jettonMetadata";
import { TokenLaunchTimings } from "./types";
import type {
    UserLaunchRewardPosition,
    UserRewardJettonBalance,
    StoredTokenLaunch,
    StoredUserBalance,
    LaunchMetadata,
    LaunchBalance,
    RewardPool, StoredTask,
} from "./Database";
import { LaunchTrend } from "oracle/src/utils";

// Manager API

export type UploadMetadataToIpfsRequest = {
    links: { x?: string, telegram?: string, website?: string },
    metadata: JettonMetadata,
    image?: string,
    influencerSupport?: boolean,
};

export type BuyWhitelistRequest = { callerAddress: RawAddressString, launchAddress: RawAddressString };

export type ConnectCallerWalletRequest = { address: RawAddressString, referral?: string, }

export type GetCallerTicketBalanceRequest = { address: RawAddressString };

export type GetCallerTasksRequest = { address?: RawAddressString, staged: string };
export type GetCallerTasksResponse = (StoredTask & { completed: boolean })[];
export type GetWhitelistStatusRequest = { tokenLaunch: RawAddressString, callerAddress: RawAddressString };

export type GetCallerRequest = { address: RawAddressString };

// Oracle API
export type LaunchTradingStats = { trend: LaunchTrend, delta: Coins };
export type ExtendedLaunch = StoredTokenLaunch & LaunchBalance & Partial<LaunchMetadata> & { activeHolders: number };

export type GetLaunchesChunkRequest = {
    page: number,
    limit: number,
    orderBy: LaunchSortParameters,
    order: SortingOrder,
    succeed?: boolean,
    createdBy?: RawAddressString,
    search?: string,
}
export type GetLaunchesChunkResponse = { launchesChunk: ExtendedLaunch[], hasMore: boolean, };

export type GetCertainLaunchRequest = { creator?: RawAddressString, address?: RawAddressString, metadataUri?: string };
export type GetCertainLaunchResponse = ExtendedLaunch & { tradingStats?: LaunchTradingStats };

export type GetUserBalancesRequest = { user: RawAddressString, launch?: RawAddressString }

export type ExtendedUserBalance = (StoredUserBalance & {
    timings: TokenLaunchTimings,
    version: GlobalVersions,
    metadata: JettonMetadata,
    totalSupply: Coins,
    isSuccessful: boolean | null,
    isCreator: boolean,
});
export type MappedUserBalances = {
    [tokenLaunch: RawAddressString]: ExtendedUserBalance
};
export type GetUserBalancesResponse = MappedUserBalances | null;

export type GetRisingStarResponse = ExtendedLaunch | null;

// Dispenser API
export type GetAmountRequest = { userAddress: RawAddressString, tokenLaunch?: RawAddressString };

export type GetRewardPoolsRequest = { tokenLaunches: RawAddressString[] };
export type MappedRewardPools = {
    [tokenLaunch: RawAddressString]: (RewardPool & { metadata: JettonMetadata })[],
};
export type GetRewardPoolsResponse = MappedRewardPools | null;

export type GetRewardPositionsRequest = { userAddress: RawAddressString, tokenLaunch?: RawAddressString };
export type MappedRewardPositions = {
    [tokenLaunch: RawAddressString]: (UserLaunchRewardPosition & { metadata: JettonMetadata })[],
};
export type GetRewardPositionsResponse = MappedRewardPositions | null;

export type GetRewardJettonBalancesRequest = { userAddress: RawAddressString };
export type GetRewardJettonBalancesResponse = (UserRewardJettonBalance & { metadata: JettonMetadata })[] | null;
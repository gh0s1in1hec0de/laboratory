import { LaunchSortParameters, SortingOrder, } from "./utils";
import type { RawAddressString } from "./standards";
import { JettonMetadata } from "./jettonMetadata";
import { TokenLaunchTimings } from "./types";
import type {
    UserLaunchRewardPosition,
    UserRewardJettonBalance,
    StoredTokenLaunch,
    StoredUserBalance,
    LaunchMetadata,
    LaunchBalance,
    RewardPool,
} from "./Database";

// Manager API

export type UploadMetadataToIpfsRequest = {
    links: { x?: string, telegram?: string, website?: string },
    metadata: JettonMetadata,
    image: string,
    influencerSupport?: boolean,
};

export type BuyWhitelistRequest = { userAddress: RawAddressString, launchAddress: RawAddressString };

export type ConnectCallerWalletRequest = { address: RawAddressString, referral?: string, }

export type GetCallerTicketBalanceRequest = { address: RawAddressString };

export type Subtask = { name: string, description: string };
export type GetCallerTasksRequest = { address?: RawAddressString, staged: string };
export type GetCallerTasksResponse = {
    taskId: number,
    name: string,
    description: Subtask[],
    rewardTickets: number,
    createdAt: number,
    completed: boolean,
}

// Oracle API

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
export type GetLaunchesChunkResponse = { launchesChunk: ExtendedLaunch[], hasMore: boolean, }

export type GetCertainLaunchRequest = { address?: RawAddressString, metadataUri?: string }
export type GetCertainLaunchResponse = ExtendedLaunch | null;

export type GetUserBalancesRequest = { user: RawAddressString, launch?: RawAddressString }
export type GetUserBalancesResponse = (StoredUserBalance & JettonMetadata & TokenLaunchTimings)[] | null;

export type GetRisingStarResponse = ExtendedLaunch | null;

// Dispenser API
export type GetAmountRequest = { userAddress: RawAddressString, tokenLaunch?: RawAddressString };

export type GetRewardPoolsRequest = { tokenLaunch: RawAddressString };
export type GetRewardPoolsResponse = (RewardPool & { metadata: JettonMetadata })[] | null;

export type GetRewardPositionsRequest = { userAddress: RawAddressString, tokenLaunch?: RawAddressString };
export type MappedRewardPositions = {
    [tokenLaunch: RawAddressString]: (UserLaunchRewardPosition & { metadata: JettonMetadata })[],
};
export type GetRewardPositionsResponse = MappedRewardPositions | null;

export type GetRewardJettonBalancesRequest = { userAddress: RawAddressString };
export type GetRewardJettonBalancesResponse = (UserRewardJettonBalance & { metadata: JettonMetadata })[] | null;
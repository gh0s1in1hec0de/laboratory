import { managerService, oracleService } from "@/api";
import { CALLER_ADDRESS } from "@/constants";
import { USER_ERROR } from "@/errors";
import { USER_ROUTES } from "@/routes";
import { Task } from "@/types";
import { localStorageWrapper } from "@/utils";
import { GetWhitelistStatusRequest, GetUserBalancesRequest, GetUserBalancesResponse } from "starton-periphery";

async function postConnectWallet(address: string, referral?: string): Promise<void> {
  try {
    await managerService.post(USER_ROUTES.ConnectWallet, {
      address,
      ...(referral ? { referral } : {})
    });
  } catch (error) {
    console.error(USER_ERROR.ConnectWallet, error);
    throw error;
  }
}

async function getTicketBalance(): Promise<number> {
  try {
    const response = await managerService.get<number>(USER_ROUTES.GetTicketBalance, {
      params: {
        address: localStorageWrapper.get(CALLER_ADDRESS),
      },
    });

    return response.data;
  } catch (error) {
    console.error(USER_ERROR.GetTicketBalance, error);
    throw error;
  }
}

async function getTasks(staged: boolean): Promise<Task[]> {
  try {
    const response = await managerService.get<Task[]>(USER_ROUTES.GetTasks, {
      params: {
        address: localStorageWrapper.get(CALLER_ADDRESS),
        staged,
      },
    });

    return response.data;
  } catch (error) {
    console.error(USER_ERROR.GetTasks, error);
    throw error;
  }
}

async function getWhitelistStatus({
  callerAddress,
  tokenLaunch
}: GetWhitelistStatusRequest): Promise<boolean> {
  try {
    const response = await managerService.get<boolean>(USER_ROUTES.GetWhitelistStatus, {
      params: {
        callerAddress,
        tokenLaunch,
      },
    });

    return response.data;
  } catch (error) {
    console.error(USER_ERROR.GetWhitelistStatus, error);
    throw error;
  }
}

async function getBalances({
  user,
  launch
}: GetUserBalancesRequest): Promise<GetUserBalancesResponse> {
  try {
    const response = await oracleService.get<GetUserBalancesResponse>(USER_ROUTES.GetBalances, {
      params: {
        user,
        launch,
      },
    });

    return response.data;
  } catch (error) {
    console.error(USER_ERROR.GetBalances, error);
    throw error;
  }
}

export const userService = {
  postConnectWallet,
  getTicketBalance,
  getTasks,
  getWhitelistStatus,
  getBalances,
};

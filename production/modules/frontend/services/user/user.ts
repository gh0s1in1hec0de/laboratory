import { managerService, oracleService } from "@/api";
import { CALLER_ADDRESS } from "@/constants";
import { USER_ERROR } from "@/errors";
import { USER_ROUTES } from "@/routes";
import { Task } from "@/types";
import { localStorageWrapper } from "@/utils";
import { GetWhitelistStatusRequest, GetUserBalancesRequest, GetUserBalancesResponse } from "starton-periphery";
import { Address } from "@ton/core";

async function postConnectWallet(address: string, referral?: string): Promise<void> {
  try {
    await managerService.post(USER_ROUTES.ConnectWallet, {
      address: Address.parse(address).toRawString(),
      ...(referral ? { referral: Address.parse(referral).toRawString() } : {}),
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
        address: Address.parse(localStorageWrapper.get(CALLER_ADDRESS)).toRawString(),
      },
    });

    return response.data;
  } catch (error) {
    console.error(USER_ERROR.GetTicketBalance, error);
    throw error;
  }
}

async function getTasks(staged: boolean, address?: string): Promise<Task[]> {
  try {
    const response = await managerService.get<Task[]>(USER_ROUTES.GetTasks, {
      params: {
        ...(address ? { address: Address.parse(address).toRawString() } : {}),
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
        callerAddress: Address.parse(callerAddress).toRawString(),
        tokenLaunch: Address.parse(tokenLaunch).toRawString(),
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
        user: Address.parse(user).toRawString(),
        ...(launch ? { launch: Address.parse(launch).toRawString() } : {}),
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

import { managerService } from "@/api";
import { CALLER_ADDRESS } from "@/constants";
import { USER_ERROR } from "@/errors";
import { USER_ROUTES } from "@/routes";
import { Task } from "@/types";
import { localStorageWrapper } from "@/utils";

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

export const launchService = {
};

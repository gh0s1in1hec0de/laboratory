import { baseService } from "@/api";
import { USER_ERROR } from "@/errors";
import { USER_ROUTES } from "@/routes";
import { localStorageWrapper } from "@/utils";

async function postConnectWallet(address: string): Promise<void> {
  try {
    await baseService.post(USER_ROUTES.ConnectWallet, {
      address,
    });
  } catch (error) {
    console.error(USER_ERROR.ConnectWallet, error);
    throw error;
  }
}

async function getTicketBalance(): Promise<number> {
  try {
    const response = await baseService.get<number>(USER_ROUTES.GetTicketBalance, {
      params: {
        address: localStorageWrapper.get("address"),
      },
    });

    return response.data;
  } catch (error) {
    console.error(USER_ERROR.GetTicketBalance, error);
    throw error;
  }
}

export const userService = {
  postConnectWallet,
  getTicketBalance,
};

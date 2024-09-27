import { baseService } from "@/api";
import { AUTH_ROUTES } from "@/routes";
import { AUTH_ERROR } from "@/error";
import axios from "axios";

async function postLoginUser(email: string, password: string): Promise<void> {
  try {
    await authenticationService.post(AUTH_ROUTES.Login, {
      email: email.toLowerCase(),
      password,
    });
  } catch (error) {
    console.error(AUTH_ERROR.Login, error);
    throw error;
  }
}

export const authService = {
  postRegisterUser,
  postLoginUser,
  postLogoutUser,
  putCheckTokens,
};

import Axios from "axios";

export function getErrorText(error: unknown, errorText: string) {
  if (Axios.isAxiosError(error)) {
    return error?.response?.data?.detail;
  }
  return errorText;
}

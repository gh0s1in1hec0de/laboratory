import Axios from "axios";

export function getErrorStatus(error: unknown) {
  if (Axios.isAxiosError(error)) {
    return error?.response?.status;
  }
  return null;
}

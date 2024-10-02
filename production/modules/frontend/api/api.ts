import { localStorageWrapper } from "@/utils";
import axios from "axios";

export const baseService = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_DEV}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

baseService.interceptors.request.use((config) => {
  const address = localStorageWrapper.get("address");
  if (address) config.headers["address"] = address;
  return config;
}, (error) => {
  return Promise.reject(error);
});

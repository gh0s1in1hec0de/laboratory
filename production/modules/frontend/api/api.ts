import { CALLER_ADDRESS } from "@/constants";
import { localStorageWrapper } from "@/utils";
import axios from "axios";

export const managerService = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_MANAGER_DEV}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const oracleService = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_ORACLE_DEV}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

managerService.interceptors.request.use((config) => {
  const address = localStorageWrapper.get(CALLER_ADDRESS);
  if (address) config.headers[CALLER_ADDRESS] = address;
  return config;
}, (error) => {
  return Promise.reject(error);
});

oracleService.interceptors.request.use((config) => {
  const address = localStorageWrapper.get(CALLER_ADDRESS);
  if (address) config.headers[CALLER_ADDRESS] = address;
  return config;
}, (error) => {
  return Promise.reject(error);
});

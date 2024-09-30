import { localStorageWrapper } from "@/utils";
import axios from "axios";

export const baseService = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_DEV}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    "address": localStorageWrapper.get("address"),
  },
});

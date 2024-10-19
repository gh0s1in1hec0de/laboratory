"use server";

import { SHOW_BANNER } from "@/constants/storage";
import { cookies } from "next/headers";

export async function getShowBanner(): Promise<boolean> {
  const showBanner = cookies().get(SHOW_BANNER)?.value;

  if (!showBanner) return true;

  return showBanner === "true" ? true : false;
}

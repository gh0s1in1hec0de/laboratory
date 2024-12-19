"use client";

import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { Address } from "@ton/core";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { FIRST_REDIRECT } from "constants/storage";

export function RedirectToLaunchFromStartParams() {
  const router = useRouter();
  const locale = useLocale();

  try {
    const firstRedirect = sessionStorage.getItem(FIRST_REDIRECT);

    if (firstRedirect === "true") {
      return null;
    }

    const { startParam } = retrieveLaunchParams();

    if (startParam && startParam.startsWith("launch_")) {
      const launchAddress = startParam.replace("launch_", "");
      router.replace(`/${locale}/${Address.parse(launchAddress).toRawString()}`);
      sessionStorage.setItem(FIRST_REDIRECT, "true");
    }
  } catch (error) {
    console.error(error);
  }

  return null;
}

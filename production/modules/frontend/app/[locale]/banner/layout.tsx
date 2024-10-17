import { PAGES } from "@/constants";
import { getShowBanner } from "@/utils";
import { unstable_setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { BannerLayoutProps } from "./types";

export default async function BannerLayout({
  children,
  params: { locale },
}: BannerLayoutProps) {
  unstable_setRequestLocale(locale);
  const showBanner = await getShowBanner();

  if (!showBanner) {
    return redirect(PAGES.Top);
  }

  return children;
}

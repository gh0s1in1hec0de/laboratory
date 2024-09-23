import type { Metadata } from "next";
import { RootLayoutProps } from "./types";
import { Manrope } from "next/font/google";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { LOCALES } from "@/constants";
import "@/styles/globals.scss";
 
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope"
});

// todo: add metadata
export const metadata: Metadata = {
  title: "StartON",
  description: "Application for creating tokens",
};

export default async function RootLayout({
  children,
  params: { locale },
}: Readonly<RootLayoutProps>) {
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={manrope.className} style={{ background: "var(--black-dark)", color: "white" }}>
        <NextIntlClientProvider messages={messages}>
          <AppRouterCacheProvider options={{ key: "css", enableCssLayer: true }}>
            {children}
          </AppRouterCacheProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

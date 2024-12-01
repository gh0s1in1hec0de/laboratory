import type { Metadata } from "next";
import { RootLayoutProps } from "./types";
import { Manrope } from "next/font/google";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { LOCALES } from "@/constants";
import "@/styles/globals.scss";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope"
});

export const metadata: Metadata = {
  title: "StartON — Best rewarding launchpad",
  description: "StartON — the ultimate community-powered launchpad with a game-changing Wavelaunch system offering up to 100% refunds. Discover innovative tokens, engage in seamless trading, and enjoy top-tier security with StartON.",
  // openGraph: {
  //   title: "StartON - The Safest TON Launchpad",
  //   description: "Join StartON to discover, trade, and launch the most exciting tokens on TON. The platform offers secure, fast transactions with support for a growing ecosystem.",
  //   url: "https://starton.mom",
  //   type: "website",
  //   images: [
  //     {
  //       url: "https://starton.mom/logo.png",
  //       width: 800,
  //       height: 600,
  //       alt: "StartON Logo",
  //     },
  //   ],
  // },
  // twitter: {
  //   card: "summary_large_image",
  //   site: "@starton",
  //   title: "StartON - TON Launchpad",
  //   description: "Trade and launch tokens on the TON blockchain with StartON, a secure and fast platform.",
  // },
  keywords: [
    "TON Blockchain", "Tokens", "Cryptocurrency", "Launchpad", "StartON", "Trading", "Blockchain", "Crypto tokens", "Decentralized finance", "TON trading"
  ],
};

export default async function RootLayout({
  children,
  params: { locale },
}: Readonly<RootLayoutProps>) {
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <GoogleAnalytics />
      </head>
      <body className={`${manrope.variable} ${manrope.className}`}>
        <NextIntlClientProvider messages={messages}>
          <AppRouterCacheProvider options={{ key: "css", enableCssLayer: true }}>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GOOGLE_ANALYTIC_ID}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              ></iframe>
            </noscript>
            {children}
          </AppRouterCacheProvider>
        </NextIntlClientProvider>
        {/* <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GOOGLE_ANALYTIC_ID || ""} /> */}
      </body>
    </html>
  );
}

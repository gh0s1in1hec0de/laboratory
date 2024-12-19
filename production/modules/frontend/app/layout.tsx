import type { Metadata } from "next";
import { RootLayoutProps } from "./types";
import { Manrope } from "next/font/google";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { FAVICONS, LOCALES } from "@/constants";
import "@/styles/globals.scss";
import { YandexMetrika } from "@/components/YandexMetrika";
import { Suspense } from "react";
import Script from "next/script";

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
  icons: FAVICONS,
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
      <body className={`${manrope.variable} ${manrope.className}`}>
        <Script id="metrika-counter" strategy="afterInteractive">
          {
            `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
 
              ym(${process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID}, "init", {
                    clickmap:true,
                    trackLinks:true,
                    accurateTrackBounce:true,
                    webvisor:true
              });`
          }
        </Script>
        <Suspense fallback={<></>}>
          <YandexMetrika />
        </Suspense>
        <NextIntlClientProvider messages={messages}>
          <AppRouterCacheProvider options={{ key: "css", enableCssLayer: true }}>
            <noscript>
              <div>
                <img src={`https://mc.yandex.ru/watch/${process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID}`} style={{ position: "absolute", left: "-9999px" }} alt="" />
              </div>
            </noscript>
            {children}
          </AppRouterCacheProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

"use client";

import { Locales, TonConnectUIProvider } from "@tonconnect/ui-react";
import { useLocale } from "next-intl";
import { PropsWithChildren } from "react";

export function TonConnectProvider({ children }: PropsWithChildren) {
  const locale = useLocale();

  return (
    <TonConnectUIProvider 
      manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json"
      language={locale as Locales}
    > 
      {children}
    </TonConnectUIProvider>
  );
}

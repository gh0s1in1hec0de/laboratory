"use client";

import { Locales, THEME, TonConnectUIProvider } from "@tonconnect/ui-react";
import { TonConnectProviderProps } from "./types";
import { useLocale } from "next-intl";

export function TonConnectProvider({ children }: TonConnectProviderProps) {
  const locale = useLocale();

  return (
    <TonConnectUIProvider 
      manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json"
      uiPreferences={{
        theme: THEME.DARK,
      }}
      language={locale as Locales}
    > 
      {children}
    </TonConnectUIProvider>
  );
}

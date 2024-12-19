"use client";

import { Locales, TonConnectUIProvider } from "@tonconnect/ui-react";
import { useLocale } from "next-intl";
import { PropsWithChildren } from "react";

export function TonConnectProvider({ children }: PropsWithChildren) {
  const locale = useLocale();

  return (
    <TonConnectUIProvider 
      manifestUrl="https://storage.starton.pro/ipfs/QmXwVGsWL9yPtRFkUgPyosUuAPyveqNzYXH5v9gtY3RwdX"
      language={locale as Locales}
    > 
      {children}
    </TonConnectUIProvider>
  );
}

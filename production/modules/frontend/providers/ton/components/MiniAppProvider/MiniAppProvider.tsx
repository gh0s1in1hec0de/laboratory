"use client";

import { SDKProvider } from "@telegram-apps/sdk-react";
import { PropsWithChildren } from "react";

export function MiniAppProvider({ children }: PropsWithChildren) {
  return (
    // <SDKProvider acceptCustomStyles debug>
    <SDKProvider acceptCustomStyles>
      {children}
    </SDKProvider>
  );
}

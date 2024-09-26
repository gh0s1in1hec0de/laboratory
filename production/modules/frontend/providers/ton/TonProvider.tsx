"use client";

import { PropsWithChildren } from "react";
import { MiniAppProvider } from "./components/MiniAppProvider";
import { TonConnectProvider } from "./components/TonConnectProvider";

export function TonProvider({ children }: PropsWithChildren) {
  return (
    <TonConnectProvider>
      <MiniAppProvider>
        {children}
      </MiniAppProvider>
    </TonConnectProvider>
  );
}

import { PropsWithChildren } from "react";

export interface AppLayoutProps extends PropsWithChildren {
  params: { locale: string };
}

import { ReactNode } from "react";

export interface AppLayoutProps {
  children: ReactNode;
  params: {locale: string};
}

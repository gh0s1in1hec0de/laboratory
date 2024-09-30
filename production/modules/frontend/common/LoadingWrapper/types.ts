import { ReactNode } from "react";

export interface LoadingWrapperProps {
  children: ReactNode;
  isLoading: boolean;
  skeleton?: ReactNode;
}

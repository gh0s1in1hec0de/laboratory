import { LoadingWrapperProps } from "./types";
import { ErrorBoundary } from "@/errors";
import { Loader } from "../Loader";

export function LoadingWrapper({ 
  children, 
  isLoading,
  skeleton = <Loader />
}: LoadingWrapperProps) {
  
  if (isLoading) {
    return skeleton;
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}

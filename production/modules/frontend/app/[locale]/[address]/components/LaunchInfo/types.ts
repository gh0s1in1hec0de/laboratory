import type { GetCertainLaunchResponse } from "starton-periphery";

export interface LaunchInfoProps {
  launchData: GetCertainLaunchResponse; 
  showRefund?: boolean;
}

import { Caller, ExtendedUserBalance } from "starton-periphery";

export interface LaunchInfoProps {
  callerData: Caller | null;
  balance: ExtendedUserBalance;
}

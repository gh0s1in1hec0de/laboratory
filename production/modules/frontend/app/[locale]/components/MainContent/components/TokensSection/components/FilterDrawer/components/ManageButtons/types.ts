import { GetLaunchesChunkRequest } from "starton-periphery";

export interface ManageButtonsProps {
  hasFilterDataChanged: (compareTo?: GetLaunchesChunkRequest) => boolean;
  handleResetFilter: () => void;
  handleApplyFilter: () => void;
}



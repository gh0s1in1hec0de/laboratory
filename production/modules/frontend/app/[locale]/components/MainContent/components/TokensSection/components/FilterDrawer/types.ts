import { LaunchSortParameters, SortingOrder } from "starton-periphery";

export interface FilterDrawerProps {
  isOpenDrawer: boolean;
  toggleOpenDrawer: () => void;
  handleSucceedChange: (value: boolean) => void;
  orderBy: LaunchSortParameters;
  handleCreatedByChange: (value: boolean) => void;
  order: SortingOrder;
  handleOrderByChange: (value: LaunchSortParameters) => void;
  handleOrderChange: (value: SortingOrder) => void;
  handleResetFilter: () => void;
  handleApplyFilter: () => void;
  hasFilterDataChanged: () => boolean;
  onCloseDrawer: () => void;
  succeed?: boolean;
  createdBy?: string;
}

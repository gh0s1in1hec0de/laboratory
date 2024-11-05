import { CustomRadioGroupOption } from "@/common/CustomRadioGroup";
import { LaunchSortParameters, SortingOrder } from "starton-periphery";

export const FILTER_DRAWER_SORT_BY_OPTIONS: CustomRadioGroupOption<LaunchSortParameters>[] = [
  {
    label: "Top.filterDrawer.sortBy.createdAt",
    value: LaunchSortParameters.CREATED_AT,
  },
  {
    label: "Top.filterDrawer.sortBy.totalTonsCollected",
    value: LaunchSortParameters.TOTAL_TONS_COLLECTED,
  },
];

export const FILTER_DRAWER_SORT_ORDER_OPTIONS: CustomRadioGroupOption<SortingOrder>[] = [
  {
    label: "Top.filterDrawer.sortOrder.decreasing",
    value: SortingOrder.HIGH_TO_LOW,
  },
  {
    label: "Top.filterDrawer.sortOrder.increasing",
    value: SortingOrder.LOW_TO_HIGH,
  },
];

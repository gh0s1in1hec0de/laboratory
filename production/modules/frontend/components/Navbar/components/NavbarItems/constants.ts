import { ProfileIcon, QuestsIcon, RewardsIcon, TokenIcon, TopIcon } from "@/icons";
import { NavbarItemType } from "../../types";

export const NAVBAR_ITEMS: Omit<NavbarItemType, "label">[] = [
  {
    id: "1",
    page: "",
    IconComponent: QuestsIcon,
  },
  {
    id: "2",
    page: "token",
    IconComponent: TokenIcon,
  },
  {
    id: "3",
    page: "top",
    IconComponent: TopIcon,
  },
  {
    id: "4",
    page: "rewards",
    IconComponent: RewardsIcon,
  },
  {
    id: "5",
    page: "profile",
    IconComponent: ProfileIcon,
  },
];

import { ProfileIcon, QuestsIcon, RewardsIcon, TokenIcon, TopIcon } from "@/icons";
import { NavbarItemType } from "./types";

export const NAVBAR_ITEMS: NavbarItemType[] = [
  {
    label: "Navbar.first",
    id: "1",
    page: "quests",
    IconComponent: QuestsIcon,
  },
  {
    label: "Navbar.second",
    id: "2",
    page: "token",
    IconComponent: TokenIcon,
  },
  {
    label: "Navbar.third",
    id: "3",
    page: "",
    IconComponent: TopIcon,
  },
  {
    label: "Navbar.fourth",
    id: "4",
    page: "rewards",
    IconComponent: RewardsIcon,
  },
  {
    label: "Navbar.fifth",
    id: "5",
    page: "profile",
    IconComponent: ProfileIcon,
  },
];

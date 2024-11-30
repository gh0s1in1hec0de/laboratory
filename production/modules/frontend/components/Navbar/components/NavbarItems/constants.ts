import { ProfileIcon, QuestsIcon, RewardsIcon, TokenIcon, TopIcon } from "@/icons";
import { NavbarItemType } from "./types";

export const NAVBAR_ITEMS: NavbarItemType[] = [
  {
    label: "Navbar.first",
    id: "1",
    page: "", // quests
    IconComponent: QuestsIcon,
  },
  {
    label: "Navbar.soon", // Navbar.second
    id: "2",
    page: "token",
    IconComponent: TokenIcon,
  },
  {
    label: "Navbar.soon", // Navbar.third
    id: "3",
    page: "top", // ""
    IconComponent: TopIcon,
  },
  {
    label: "Navbar.soon", // Navbar.fourth
    id: "4",
    page: "rewards",
    IconComponent: RewardsIcon,
  },
  {
    label: "Navbar.soon", // Navbar.fifth
    id: "5",
    page: "profile",
    IconComponent: ProfileIcon,
  },
];

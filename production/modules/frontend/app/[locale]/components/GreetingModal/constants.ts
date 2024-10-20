import { GreetingModalItem } from "./types";
import { JoinNextWave, StartOnTonIcon, RefoundUpIcon, GetRewardsIcon, FirstRuleIcon } from "@/icons";

export const GREETING_MODAL_ITEMS: GreetingModalItem[] = [
  {
    Icon: StartOnTonIcon,
    title: "Banners.greeting.firstSlide.title",
    description: "Banners.greeting.firstSlide.description",
  },
  {
    Icon: JoinNextWave,
    title: "Banners.greeting.secondSlide.title",
    description: "Banners.greeting.secondSlide.description",
  },
  {
    Icon: FirstRuleIcon,
    title: "Banners.greeting.thirdSlide.title",
    description: "Banners.greeting.thirdSlide.description",
  },
  {
    Icon: RefoundUpIcon,
    title: "Banners.greeting.fourthSlide.title",
    description: "Banners.greeting.fourthSlide.description",
  },
  {
    Icon: GetRewardsIcon,
    title: "Banners.greeting.fifthSlide.title",
    description: "Banners.greeting.fifthSlide.description",
  },
];

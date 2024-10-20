import { GreetingModalItem } from "../../types";

export interface GreetingSlideProps {
  item: GreetingModalItem;
  index: number;
  closeBanner: () => void;
}

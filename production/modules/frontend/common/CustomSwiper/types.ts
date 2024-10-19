import { PropsWithChildren } from "react";
import { SwiperOptions } from "swiper/types";

export interface SwiperBreakpoints {
  [width: number]: SwiperOptions;

  [ratio: string]: SwiperOptions;
}

export interface CustomSwiperProps extends PropsWithChildren {
  breakpoints?: SwiperBreakpoints;
  spaceBetween?: number | string;
  onSlideClick?: () => void;
}

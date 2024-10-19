"use client";

import { Keyboard, Navigation, Pagination } from "swiper/modules";
import { Swiper, useSwiper } from "swiper/react";
import { CustomSwiperProps } from "./types";
import "./CustomSwiper.scss";
import "swiper/css/pagination";
// import "swiper/css/navigation";
import "swiper/css";

export function CustomSwiper({
  children,
  breakpoints,
  spaceBetween,
  onSlideClick
}: CustomSwiperProps) {
  return (
    <Swiper
      className="mySwiper"
      breakpoints={breakpoints}
      spaceBetween={spaceBetween}
      modules={[Keyboard, Pagination, Navigation]}
      onClick={onSlideClick}
      keyboard={true}
      // navigation={true}
      // onSwiper={(swiper) => {
      //   swiperRef.current = swiper;
      // }}
      pagination={{
        dynamicBullets: true,
      }}
    >
      {children}
    </Swiper>
  );
}

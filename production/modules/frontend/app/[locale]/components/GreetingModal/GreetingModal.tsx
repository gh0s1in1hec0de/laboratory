"use client";

import { CustomModal } from "@/common/CustomModal";
import { CustomSwiper } from "@/common/CustomSwiper";
import { Label } from "@/common/Label";
import { SHOW_GREETING } from "@/constants";
import { useToggle } from "@/hooks/useToggle";
import { ArrowRightIcon } from "@/icons";
import { localStorageWrapper } from "@/utils";
import Grid from "@mui/material/Grid2";
import { SwiperSlide } from "swiper/react";
import { GreetingSlide } from "./components/GreetingSlide";
import { GREETING_MODAL_ITEMS } from "./constants";

export function GreetingModal() {
  const [isOpen, toggleIsOpen] = useToggle(localStorageWrapper.get(SHOW_GREETING) ?? true);

  function closeBanner() {
    localStorageWrapper.set(SHOW_GREETING, false);
    toggleIsOpen();
  }

  return (
    <CustomModal
      isOpen={isOpen}
      autoClose={false}
      fullScreen
    >
      <Grid
        container
        justifyContent="flex-end"
        paddingBottom={1}
        onClick={closeBanner}
        sx={{ cursor: "pointer" }}
        alignItems="center"
      >
        <Label
          label="Skip"
          variantSize="regular14"
          variantColor="gray"
          offUserSelect
        />
        <ArrowRightIcon />
      </Grid>

      <Grid
        container
        gap={1}
        flexDirection="column"
        width="100%"
        height="95%"
      >
        <CustomSwiper spaceBetween={40}>
          {GREETING_MODAL_ITEMS.map((item, index) => (
            <SwiperSlide key={index}>
              <GreetingSlide 
                item={item} 
                index={index} 
                closeBanner={closeBanner} 
              />
            </SwiperSlide>
          ))}
        </CustomSwiper>
      </Grid>
    </CustomModal>
  );
}

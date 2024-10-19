import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { MouseEvent } from "react";
import { useSwiper } from "swiper/react";
import { GreetingSlideProps } from "./types";
import { useTranslations } from "next-intl";
import { CustomButton } from "@/common/CustomButton";
import { GREETING_MODAL_ITEMS } from "../../constants";

export function GreetingSlide({ item, index, closeBanner }: GreetingSlideProps) {
  const t = useTranslations("");
  const swiper = useSwiper();

  function handleSlideClick(event: MouseEvent<HTMLDivElement>) {
    const slideWidth = event.currentTarget.offsetWidth;
    const clickX = event.nativeEvent.offsetX;

    if (clickX < slideWidth / 2) {
      swiper.slidePrev();
    } else {
      swiper.slideNext();
    }
  }

  return (
    <Grid
      container
      flexDirection="column"
      alignItems="center"
      height="100%"
      onClick={handleSlideClick}
    >
      <item.Icon />
      <Grid
        container
        flexDirection="column"
        gap={1.5}
        alignItems="center"
        justifyContent="center"
        size={{ xs: 9 }}
        paddingBottom={2}
      >
        <Label
          label={t(item.title)}
          variantSize="bold24"
          textAlign="center"
          offUserSelect
        />
        <Label
          label={t(item.description)}
          variantSize="regular16"
          variantColor="gray"
          textAlign="center"
          offUserSelect
        />
      </Grid>
      {index === GREETING_MODAL_ITEMS.length - 1 && (
        <CustomButton
          fullWidth
          onClick={closeBanner}
          padding="6px"
        >
          <Label
            label={t("Banners.greeting.closeButton")}
            variantSize="medium16"
            offUserSelect
          />
        </CustomButton>
      )}
    </Grid>
  );
}


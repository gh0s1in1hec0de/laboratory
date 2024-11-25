import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { ArrowUpRightIcon } from "@/icons";
import Grid from "@mui/material/Grid2";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PAGES } from "@/constants";

export function GetTicketsButton() {
  const t = useTranslations("CurrentLaunch.contribute");
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(() => {
      router.push(`/${locale}/${PAGES.Quests}`);
    });
  }

  return (
    <LoadingWrapper
      isLoading={isPending}
    >
      <CustomButton
        fullWidth
        padding="10px"
        background="gray"
        onClick={handleClick}
      >
        <Grid
          container
          gap={1}
          alignItems="center"
          justifyContent="center"
        >
          <ArrowUpRightIcon />
          <Label
            label={t("getStarTicket")}
            variantSize="regular16"
            offUserSelect
          />
        </Grid>
      </CustomButton>
    </LoadingWrapper>
  );
}

"use client";

import Grid from "@mui/material/Grid2";
import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { ArrowUpRightIcon } from "@/icons";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { PAGES } from "@/constants";
import { useRouter } from "next/navigation";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { TicketBalance } from "../../../quests/components/Header/components/TicketBalance";

export function RedirectButtons() {
  const t = useTranslations("Profile");
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleRedirect(page: PAGES) {
    startTransition(() => {
      router.push(`/${locale}/${page}`);
    });
  }

  return (
    <LoadingWrapper isLoading={isPending}>
      <Grid
        container
        gap={1}
        width="100%"
      >
        <Grid
          container
          size="grow"
        >
          <CustomButton
            background="gray"
            padding="10px 0"
            fullWidth
            onClick={() => handleRedirect(PAGES.Top)}
          >
            <Grid
              container
              gap={1}
              alignItems="center"
              justifyContent="center"
            >
              <ArrowUpRightIcon />
              <Label
                label={t("token")}
                variantSize="medium16"
                offUserSelect
              />
            </Grid>
          </CustomButton>
        </Grid>

        <Grid
          container
          size="grow"
        >
          <CustomButton
            background="gray"
            padding="10px 0"
            fullWidth
            onClick={() => handleRedirect(PAGES.Rewards)}
          >
            <Grid
              container
              gap={1}
              alignItems="center"
              justifyContent="center"
            >
              <ArrowUpRightIcon />
              <Label
                label={t("rewards")}
                variantSize="medium16"
                offUserSelect
              />
            </Grid>
          </CustomButton>
        </Grid>
      </Grid>

      <TicketBalance
        description={t("balanceDescription")}
        rounded="full"
        showRedirectButton
        padding="8px 8px 8px 28px"
      />
    </LoadingWrapper>
  );
}

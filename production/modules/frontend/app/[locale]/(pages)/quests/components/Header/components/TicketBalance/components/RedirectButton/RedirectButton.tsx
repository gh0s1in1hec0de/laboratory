"use client";

import { IconButton } from "@mui/material";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PAGES } from "@/constants";
import { useLocale } from "next-intl";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { ArrowUpRightIcon } from "@/icons";
import styles from "./RedirectButton.module.scss";

export function RedirectButton() {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function onClickRedirectButton() {
    startTransition(() => {
      router.push(`/${locale}/${PAGES.Quests}`);
    });
  }

  return (
    <LoadingWrapper isLoading={isPending}>
      <IconButton 
        onClick={onClickRedirectButton}
        classes={{
          root: styles.redirectButton,
          
        }}
      >
        <ArrowUpRightIcon />
      </IconButton>
    </LoadingWrapper>
  );
}

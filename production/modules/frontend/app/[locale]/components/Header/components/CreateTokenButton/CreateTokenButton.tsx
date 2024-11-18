"use client";

import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { PAGES } from "@/constants";
import { useTransition } from "react";
import { LoadingWrapper } from "@/common/LoadingWrapper";

export function CreateTokenButton() {
  const t = useTranslations("Top");
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(() => {
      router.push(`/${locale}/${PAGES.Token}`);
    });
  }

  return (
    <LoadingWrapper isLoading={isPending}>
      <CustomButton
        onClick={handleClick}
        padding="8px 14px"
      >
        <Label label={t("createToken")} variantSize="medium14" />
      </CustomButton>
    </LoadingWrapper>
  );
}

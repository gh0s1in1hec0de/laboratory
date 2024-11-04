"use client";

import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";

export function CreateTokenButton() {
  const t = useTranslations("Top");

  // todo: add logic
  function handleClick() {
    console.log("Create token");
  }

  return (
    <CustomButton
      onClick={handleClick}
      padding="8px 14px"
    >
      <Label label={t("createToken")} variantSize="medium14" />
    </CustomButton>
  );
}

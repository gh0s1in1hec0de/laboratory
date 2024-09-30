"use client";

import { Label } from "@/common/Label";
import { useTicketBalance } from "./hooks/useTicketBalance";
import { useTranslations } from "next-intl";

export function Balance() {
  const { 
    balance, 
    error 
  } = useTicketBalance();
  const t = useTranslations("Quests.header");

  return (
    <Label 
      label={error ? t("error") : `${balance}/3 ${t("tickets")}`} 
      variantSize={error ? "medium14" : "semiBold32"} 
      variantColor={error ? "red" : "white"}
    />
  );
}

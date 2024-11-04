"use client";

import { Label } from "@/common/Label";
import { useTicketBalance } from "./hooks/useTicketBalance";
import { useTranslations } from "next-intl";
import Grid from "@mui/material/Grid2";

export function Balance() {
  const { 
    balance, 
    error 
  } = useTicketBalance();
  const t = useTranslations("Tasks.header");

  return (
    <Grid container flex={1}>
      <Label 
        label={error ? t("error") : `${balance}/3 ${t("tickets")}`} 
        variantSize={error ? "medium14" : "medium32"} 
        variantColor={error ? "red" : "white"}
        cropped
      />
    </Grid>
  );
}

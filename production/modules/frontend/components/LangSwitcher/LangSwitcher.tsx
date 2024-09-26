"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALES } from "@/constants";
import { removeLocaleFromPath } from "@/utils";
import { Locales, useTonConnectUI } from "@tonconnect/ui-react";
import { useLocale } from "next-intl";
import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { useTransition } from "react";
import { Loader } from "@/common/Loader";
import Box from "@mui/material/Box";
import styles from "./LangSwitcher.module.scss";

export function LangSwitcher() {
  const [_, setOptions] = useTonConnectUI();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleSwitchLanguage(newLocale: string) {
    startTransition(() => {
      const pathWithoutLocale = removeLocaleFromPath(pathname);
      router.replace(`/${newLocale}/${pathWithoutLocale}`);
      setOptions({ language: newLocale as Locales });
      if (locale !== newLocale) {
        router.refresh();
      }
    });
  }

  if (isPending) {
    return <Loader/>;
  }

  return (
    <Box className={styles.wrapper}>
      {LOCALES.map((currLocale) => (
        <CustomButton
          key={currLocale} 
          className={styles.button}
          onClick={() => handleSwitchLanguage(currLocale)}
          background={locale === currLocale ? "gray" : "transparent"}
          padding="6px"
          borderRadius={14}
          addHover={locale !== currLocale}
        >
          {currLocale === "ru" ? "🇷🇺" : "🇬🇧"}

          <Label
            label={currLocale.toUpperCase()}
            variantSize="regular14"
            variantColor={locale === currLocale ? "white" : "gray"}
          />
        </CustomButton>
      ))}
    </Box>
  );
}

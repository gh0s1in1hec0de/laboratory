"use client";

import { Box, IconButton } from "@mui/material";
import { Label } from "@/common/Label";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { removeLocaleFromPath } from "@/utils";
import { NAVBAR_ITEMS } from "./constants";
import { NavbarItemType } from "./types";
import { useTransition } from "react";
import { LoadingWrapper } from "@/common/LoadingWrapper";

export function NavbarItems() {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("");
  const [isPending, startTransition] = useTransition();

  function handleClick(page: Pick<NavbarItemType, "page">) {
    startTransition(() => {
      router.push(`/${locale}/${page.page}`);
    });
  }

  function isActive(page: Pick<NavbarItemType, "page">) {
    return removeLocaleFromPath(pathname) === page.page;
  }
  
  return(
    <LoadingWrapper isLoading={isPending}>
      {NAVBAR_ITEMS.map(({ page, IconComponent, id, label }) => (
        <Box
          key={id}
          minWidth={50}
          display="flex"
          alignItems="center"
          flexDirection="column"
          onClick={() => handleClick({ page })}
          sx={{ cursor: "pointer", WebkitTapHighlightColor: "transparent" }}
        >
          <IconButton style={{ padding: 0, cursor: "inherit" }}>
            <IconComponent active={isActive({ page })}/>
          </IconButton>
          <Label
            label={t(label)}
            variantColor={isActive({ page }) ? "orange" : "gray"}
            variantSize="medium10"
            offUserSelect
          />
        </Box>
      ))}
    </LoadingWrapper>
  );
}

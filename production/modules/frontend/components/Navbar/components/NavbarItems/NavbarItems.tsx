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
        <IconButton
          key={id}
          style={{ padding: 0, cursor: "pointer" }}
          onClick={() => handleClick({ page })}
        >
          <Box
            minWidth={50}
            display="flex"
            alignItems="center"
            flexDirection="column"
            sx={{ cursor: "inherit", WebkitTapHighlightColor: "transparent" }}
          >
            <IconComponent active={isActive({ page })}/>
            <Label
              label={t(label)}
              variantColor={isActive({ page }) ? "orange" : "gray"}
              variantSize="medium10"
              offUserSelect
            />
          </Box>
        </IconButton>
      ))}
    </LoadingWrapper>
  );
}
